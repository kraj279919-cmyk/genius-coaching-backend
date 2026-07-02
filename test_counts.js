const axios = require('axios');
const mongoose = require('mongoose');

async function run() {
  try {
    // 1. We don't have a live token here easily, so let's check directly via the controller logic
    // Actually, I can just connect to DB and run the counts directly to verify the DB has data.
    require('dotenv').config();
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const Student = require('./models/Student');
    const Teacher = require('./models/Teacher');
    const Notice = require('./models/Notice');
    
    console.log('Total Students:', await Student.countDocuments());
    console.log('Total Teachers:', await Teacher.countDocuments());
    console.log('Active Notices:', await Notice.countDocuments());
    
    mongoose.connection.close();
  } catch(e) {
    console.error(e);
  }
}
run();
