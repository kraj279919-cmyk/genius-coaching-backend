const mongoose = require('mongoose');

const websiteContentSchema = new mongoose.Schema({
  bannerText: { type: String },
  aboutUs: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String },
  address: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('WebsiteContent', websiteContentSchema);
