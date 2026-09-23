import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const signToken = (id: string) =>
  jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);
  if (!emailRegex.test(email)) throw new AppError('Please enter a valid email', 400);
  if (String(password).length < 6) throw new AppError('Password must be at least 6 characters', 400);

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw new AppError('Email is already registered', 409);

  const user = await User.create({ name, email, password });
  res.status(201).json({
    success: true,
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new AppError('Email and password are required', 400);

  // password has select:false in the schema, so we ask for it explicitly here
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  res.json({
    success: true,
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});
