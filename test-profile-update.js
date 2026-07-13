const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

const testUpdateProfile = async () => {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Get a token for teacher
    const res = await axios.post(`${API_URL}/auth/login`, { identifier: 'teacher@test.com', password: 'Test@123' });
    const token = res.data.token;
    console.log('Token acquired:', token.substring(0, 20) + '...');

    // 2. Try to update profile image
    try {
      const updateRes = await axios.put(`${API_URL}/auth/profile`, {
        profileImageUrl: 'https://cloudinary.com/dummy.jpg'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Update Success:', updateRes.data);
      
      const Teacher = require('./models/Teacher');
      const doc = await Teacher.findOne({ userId: updateRes.data._id });
      console.log('Teacher Doc Profile Image:', doc ? doc.profileImage : 'No doc found');
    } catch (err) {
      console.error('Update Failed:', err.response?.status, err.response?.data);
    }

  } catch (error) {
    console.error('Fatal Test Error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

testUpdateProfile();
