const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const bcrypt = require('bcryptjs');

require('dotenv').config();

async function testLogin() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // 1. Create a test student
  const phone = '9999999999';
  const password = 'password123';
  
  await User.deleteOne({ phone });
  await Student.deleteOne({ phone });
  
  const user = await User.create({
    name: 'Test Student',
    phone,
    password,
    role: 'student'
  });
  
  console.log('User created:', user);
  
  // 2. Try login using matchPassword
  const match = await user.matchPassword(password);
  console.log('Password match from instance:', match);
  
  // 3. Try finding and matching like authController does
  const foundUser = await User.findOne({ phone });
  const loginMatch = await foundUser.matchPassword(password);
  console.log('Password match from DB:', loginMatch);
  
  mongoose.connection.close();
}

testLogin().catch(console.error);
