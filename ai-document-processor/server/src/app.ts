import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';

// app is created here (separate from server.ts) so tests can import it without starting the server
const app = express();

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is running' });
});
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
