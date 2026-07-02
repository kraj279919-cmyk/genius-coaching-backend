const mongoose = require('mongoose');

const websiteContentSchema = new mongoose.Schema({
  // Legacy backward-compatible fields
  bannerText: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String },
  isActive: { type: Boolean, default: true },
  
  // V1.0 CMS Fields
  instituteName: { type: String, default: 'Genius Coaching' },
  heroTitle: { type: String, default: 'Welcome to Genius Coaching' },
  heroSubtitle: { type: String, default: 'Empowering students to achieve their dreams.' },
  aboutUs: { type: String },
  directorName: { type: String },
  directorMessage: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  logoUrl: { type: String },
  bannerUrl: { type: String },
  directorPhotoUrl: { type: String },
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    youtube: { type: String }
  },
  admissionText: { type: String },
  footerText: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('WebsiteContent', websiteContentSchema);
