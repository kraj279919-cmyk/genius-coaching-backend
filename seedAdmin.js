const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Adjust path if needed

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const email = 'geniuscoachinginstitute1@gmail.com';
    const password = 'director123';

    let user = await User.findOne({ email });

    if (user) {
      console.log('User found. Updating password...');
      user.password = password;
      user.role = 'admin';
      user.name = 'Dhananjay Kumar';
      await user.save();
      console.log('Admin user updated successfully.');
    } else {
      console.log('User not found. Creating new admin user...');
      user = new User({
        name: 'Dhananjay Kumar',
        email,
        password,
        role: 'admin',
      });
      await user.save();
      console.log('Admin user created successfully.');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
