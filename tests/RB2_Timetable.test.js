const request = require('supertest');
const app = require('../server');
jest.mock('../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    if (req.headers.authorization === 'Bearer mock_student') {
      req.user = { _id: '507f1f77bcf86cd799439011', role: 'student', status: 'active' };
      return next();
    }
    if (req.headers.authorization === 'Bearer mock_teacher') {
      req.user = { _id: '507f1f77bcf86cd799439011', role: 'teacher', status: 'active' };
      return next();
    }
    if (req.headers.authorization === 'Bearer mock_admin') {
      req.user = { _id: '507f1f77bcf86cd799439012', role: 'admin', status: 'active' };
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  }
}));

describe('Timetable Role Security', () => {
  let studentToken = 'mock_student';
  let teacherToken = 'mock_teacher';
  let adminToken = 'mock_admin';

  afterAll(async () => {
    // cleanup
  });

  it('Students can view their timetable', async () => {
    const res = await request(app)
      .get('/api/timetable?class=10')
      .set('Authorization', 'Bearer ' + studentToken);
    
    expect(res.statusCode).not.toBe(403);
  });

  it('Teachers can view timetables', async () => {
    const res = await request(app)
      .get('/api/timetable')
      .set('Authorization', 'Bearer ' + teacherToken);
    
    expect(res.statusCode).not.toBe(403);
  });

  it('Teachers cannot create timetables', async () => {
    const res = await request(app)
      .post('/api/timetable')
      .set('Authorization', 'Bearer ' + teacherToken)
      .send({ class: '10', day: 'Monday', subject: 'Math', teacher: 'John', startTime: '10:00' });
    
    expect(res.statusCode).toBe(403); // Forbidden
  });

  it('Admins can create timetables', async () => {
    const res = await request(app)
      .post('/api/timetable')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ class: '10', day: 'Monday', subject: 'Math', teacher: 'John', startTime: '10:00' });
    
    expect(res.statusCode).not.toBe(403);
  });
});
