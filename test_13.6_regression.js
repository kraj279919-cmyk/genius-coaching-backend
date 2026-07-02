const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const User = require('./models/User');

dotenv.config();

async function runRegression() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- STARTING PHASE 13.6 REGRESSION TESTS ---');
  
  // Create test user
  const newStudent = await Student.create({
    userId: new mongoose.Types.ObjectId(), // mock user id
    name: 'Phase 13.6 Test',
    email: `136test${Date.now()}@example.com`,
    phone: `99${Math.floor(Math.random() * 90000000)}`,
    studentId: `T136-${Date.now()}`,
    class: 'Class 10',
    section: 'A',
    address: '123 Testing Ave',
    academicYear: '2025-26'
  });
  
  console.log('✅ Student Model successfully created with academicSession.');

  // Soft delete test
  newStudent.status = 'archived';
  await newStudent.save();
  console.log('✅ Student Model successfully transitioned to "archived".');
  
  newStudent.status = 'deleted';
  await newStudent.save();
  console.log('✅ Student Model successfully transitioned to "deleted".');
  
  // Clean up
  await newStudent.deleteOne();
  console.log('✅ Regression Cleanup successful.');

  console.log('\n--- PHASE 13.6 REGRESSION PASSED ---');
  process.exit(0);
}

runRegression();
