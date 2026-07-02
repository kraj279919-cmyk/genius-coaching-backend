const mongoose = require('mongoose');

const instituteSettingsSchema = new mongoose.Schema({
  // Phase 1: Institute Settings
  name: { type: String, default: 'Genius Coaching Classes' },
  phone: { type: String, default: '+91 9999999999' },
  email: { type: String, default: 'info@geniuscoaching.com' },
  address: { type: String, default: '123 Education Street' },
  website: { type: String, default: 'www.geniuscoaching.com' },
  logoUrl: { type: String },
  institutePhotoUrl: { type: String },
  academicSession: { type: String, default: '2025-26' },
  workingDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  schoolTiming: { type: String, default: '08:00 AM - 02:00 PM' },
  theme: { type: String, default: 'light' },
  language: { type: String, default: 'en' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  version: { type: String, default: '1.3.7' },

  // Phase 7: Feature Flags
  features: {
    homework: { type: Boolean, default: true },
    attendance: { type: Boolean, default: true },
    results: { type: Boolean, default: true },
    fees: { type: Boolean, default: true },
    gallery: { type: Boolean, default: true },
    websiteCms: { type: Boolean, default: true },
    ai: { type: Boolean, default: false }, // AI disabled by default
    admission: { type: Boolean, default: true },
    onlinePayment: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    liveClasses: { type: Boolean, default: false },
    onlineTest: { type: Boolean, default: false },
    leaderboard: { type: Boolean, default: true },
  },

  // Phase 10: Emergency Controls
  emergency: {
    maintenanceMode: { type: Boolean, default: false },
    readOnlyMode: { type: Boolean, default: false },
    disableLogin: { type: Boolean, default: false },
    disableStudentLogin: { type: Boolean, default: false },
    disableTeacherLogin: { type: Boolean, default: false },
    emergencyNotice: { type: String, default: '' },
  }

}, { timestamps: true });

module.exports = mongoose.model('InstituteSettings', instituteSettingsSchema);
