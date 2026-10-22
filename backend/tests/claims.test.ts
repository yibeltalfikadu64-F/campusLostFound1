import request from 'supertest';
import app from '../src/app';

describe('Claims API & State Machine Security', () => {
  const fakeItemId = '11111111-2222-3333-4444-555555555555';

  it('should prevent unauthenticated claim submission with 401', async () => {
    const res = await request(app)
      .post(`/api/v1/items/${fakeItemId}/claims`)
      .send({
        proofDescription: 'I lost this item yesterday and have the matching key.'
      });

    expect(res.status).toBe(401);
  });

  it('should prevent unauthenticated claim approval with 401', async () => {
    const res = await request(app)
      .patch(`/api/v1/claims/${fakeItemId}/approve`)
      .send({ reviewNote: 'Looks valid' });

    expect(res.status).toBe(401);
  });

  it('should prevent unauthenticated handover scheduling with 401', async () => {
    const res = await request(app)
      .patch(`/api/v1/claims/${fakeItemId}/handover`)
      .send({
        handoverLocation: 'Campus Security Gate'
      });

    expect(res.status).toBe(401);
  });
});
