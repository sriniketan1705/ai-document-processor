import request from 'supertest';
import app from '../src/app';

// These tests cover the routes that respond BEFORE touching the database
// (validation + auth), so they run without MongoDB.
describe('API basics', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('unknown route returns 404 JSON', async () => {
    const res = await request(app).get('/api/nothing-here');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth validation', () => {
  test('register without fields returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  test('register with invalid email returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
  });

  test('register with short password returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  test('login without password returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('Protected routes', () => {
  test('GET /api/documents without token returns 401', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });

  test('GET /api/documents with a bad token returns 401', async () => {
    const res = await request(app).get('/api/documents').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
