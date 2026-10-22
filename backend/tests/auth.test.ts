import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';

describe('Auth API Endpoints', () => {
  const testStudent = {
    fullName: 'Abebe Bikila',
    email: 'abikila@injibara.edu.et',
    universityId: 'UGR/99999/14',
    phone: '+251911999999',
    department: 'Sport Science',
    password: 'SecurePassword123!'
  };

  afterAll(async () => {
    // Cleanup created test records
    try {
      await prisma.refreshToken.deleteMany({
        where: { user: { email: testStudent.email } }
      });
      await prisma.user.deleteMany({
        where: { email: testStudent.email }
      });
    } catch {
      // Ignore if DB not connected during disconnected unit test
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should reject registration when password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testStudent,
          password: 'short'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should reject registration when neither email nor student ID is provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test Student',
          phone: '+251911000000',
          password: 'Password123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration when phone number is missing or invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testStudent,
          phone: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should reject login with empty credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with invalid password format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'nonexistent@injibara.edu.et',
          password: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return service health status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service).toBe('Injibara Campus Lost and Found API');
    });
  });
});
