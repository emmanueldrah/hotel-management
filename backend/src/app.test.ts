import request from 'supertest';
import { createApp } from './app';

const app = createApp();

describe('app (no DB required)', () => {
  it('responds to health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('rejects login with invalid body (validation)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('blocks protected routes without a token', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats');
    expect(res.status).toBe(401);
  });
});
