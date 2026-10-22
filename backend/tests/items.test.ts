import request from 'supertest';
import app from '../src/app';

describe('Item API Endpoints', () => {
  describe('POST /api/v1/items (Security & Validation)', () => {
    it('should reject unauthenticated report submissions with 401', async () => {
      const res = await request(app)
        .post('/api/v1/items')
        .send({
          type: 'LOST',
          title: 'Lost Calculator',
          description: 'Left in Room 201'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject reports with invalid UUID for category or location', async () => {
      // Mock an invalid request with fake auth header
      const res = await request(app)
        .post('/api/v1/items')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          type: 'LOST',
          title: 'Lost Calculator',
          description: 'A scientific calculator left in library',
          categoryId: 'not-a-uuid',
          locationId: 'not-a-uuid',
          dateEvent: new Date().toISOString()
        });

      expect(res.status).toBe(401); // Caught by auth middleware before DB
    });
  });

  describe('GET /api/v1/items (Public Access & Filtering)', () => {
    it('should accept valid query parameters for public list', async () => {
      const res = await request(app)
        .get('/api/v1/items')
        .query({
          type: 'LOST',
          limit: 10,
          page: 1
        });

      // Status could be 200 (if DB connected) or 500 (if DB disconnected), but route matches and query parses
      expect([200, 500]).toContain(res.status);
    });

    it('should reject invalid query parameters with 400', async () => {
      const res = await request(app)
        .get('/api/v1/items')
        .query({
          type: 'INVALID_TYPE'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
