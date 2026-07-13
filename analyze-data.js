const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');

dotenv.config();

const analyzeData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const studentsWithStreamInClass = await Student.find({
      class: { $regex: /science|commerce|arts/i }
    }).select('name class section').lean();
    
    console.log(`Found ${studentsWithStreamInClass.length} students with stream in 'class' field.`);
    if (studentsWithStreamInClass.length > 0) {
      console.log('Sample:', studentsWithStreamInClass.slice(0, 3));
    }
    
    const studentsWithNumber = await Student.find({
      class: { $regex: /11|12|10|9|x|xi|xii|ix/i }
    }).select('name class section').lean();
    
    console.log(`Found ${studentsWithNumber.length} total students.`);
    if (studentsWithNumber.length > 0) {
      console.log('Sample classes:', [...new Set(studentsWithNumber.map(s => s.class))]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

analyzeData();
