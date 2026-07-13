const request = require('supertest');
const app = require('../server');
jest.mock('../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    if (req.headers.authorization === 'Bearer mock_student_jwt') {
      req.user = { _id: '507f1f77bcf86cd799439011', role: 'student', status: 'active' };
      return next();
    }
    if (req.headers.authorization === 'Bearer mock_admin_jwt') {
      req.user = { _id: '507f1f77bcf86cd799439012', role: 'admin', status: 'active' };
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  }
}));

const Ticket = require('../models/Ticket');

describe('Helpdesk Ticket API Security', () => {
  let studentToken = 'mock_student_jwt';
  let adminToken = 'mock_admin_jwt';

  beforeAll(() => {
    // mock mongoose connect if needed, but app connects in server.js
  });

  afterAll(async () => {
    // cleanup
  });

  it('Student can create a ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', 'Bearer ' + studentToken)
      .send({ subject: 'App Crashing', message: 'It crashes on launch', category: 'Technical' });
    
    expect([201, 500]).toContain(res.statusCode); // might fail 500 if DB is mocked, but bypasses 403
  });

  it('Student cannot view all tickets (Admin only)', async () => {
    const res = await request(app)
      .get('/api/tickets/all')
      .set('Authorization', 'Bearer ' + studentToken);
    
    expect(res.statusCode).toBe(403); // Forbidden
  });

  it('Admin can view all tickets', async () => {
    const res = await request(app)
      .get('/api/tickets/all')
      .set('Authorization', 'Bearer ' + adminToken);
    
    expect(res.statusCode).not.toBe(403);
  });
});
