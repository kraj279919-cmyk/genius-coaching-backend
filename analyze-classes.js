const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Homework = require('./models/Homework');

dotenv.config();

const analyzeClasses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const studentClasses = await Student.distinct('class');
    console.log('Distinct classes in Student:', studentClasses);
    
    const homeworkClasses = await Homework.distinct('class');
    console.log('Distinct classes in Homework:', homeworkClasses);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

analyzeClasses();
