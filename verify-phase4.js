const express = require('express');
const app = require('./server'); // This might start the server if it's not exported properly, let's just require the route files directly to check for syntax errors.

console.log("Checking Attendance routes...");
try {
  require('./routes/attendanceRoutes');
  console.log("attendanceRoutes OK");
  
  require('./routes/teacherAttendanceRoutes');
  console.log("teacherAttendanceRoutes OK");
  
  require('./controllers/attendanceController');
  console.log("attendanceController OK");
  
  require('./controllers/teacherAttendanceController');
  console.log("teacherAttendanceController OK");
  
  require('./models/Attendance');
  require('./models/TeacherAttendance');
  console.log("Models OK");
  
  console.log("ALL PHASE 4 BACKEND FILES COMPILE CORRECTLY!");
} catch (error) {
  console.error("Syntax Error Found:", error);
}
