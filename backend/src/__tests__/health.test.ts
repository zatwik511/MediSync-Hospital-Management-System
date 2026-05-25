// Mock the DB before anything imports it — this prevents the "Missing DATABASE_URL"
// throw and avoids real network connections during tests.
jest.mock('../database/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    }),
  },
}));

import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('includes uptime as a number', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('includes a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.timestamp).toBe('string');
    expect(() => new Date(res.body.timestamp)).not.toThrow();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});

describe('GET /nonexistent-route', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
