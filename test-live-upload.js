const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const LIVE_API_URL = 'https://genius-coaching-backend.onrender.com/api';

async function runLiveTests() {
  try {
    console.log('--- STARTING LIVE DEPLOYMENT UPLOAD API TESTS ---');
    
    // Connect to DB to get a real admin ID for the LIVE environment
    // Use the local process.env.MONGO_URI and process.env.JWT_SECRET which should match live
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const admin = await User.findOne({ role: { $in: ['admin', 'director'] } });
    if (!admin) throw new Error('No admin found in DB');
    
    const payload = { id: admin._id, role: admin.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('✅ Live Admin token generated for:', admin.email || admin.name);

    const headers = { 'Authorization': `Bearer ${token}` };

    const realImgPath = 'C:\\Projects\\genius-mobile-54\\assets\\logo-round.png';
    fs.writeFileSync('test_live.pdf', '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    // Test 1: Upload JPG to Live Server
    console.log('\n▶ Test 1: Upload Image (Live)');
    const formJpg = new FormData();
    formJpg.append('file', fs.createReadStream(realImgPath), { contentType: 'image/png' });
    const resJpg = await axios.post(`${LIVE_API_URL}/upload?type=profile`, formJpg, { headers: { ...headers, ...formJpg.getHeaders() } });
    console.log('✅ JPG Uploaded:', resJpg.data.file.url);
    const jpgId = resJpg.data.file.publicId;

    // Test 2: Upload PDF to Live Server
    console.log('\n▶ Test 2: Upload PDF (Live)');
    const formPdf = new FormData();
    formPdf.append('file', fs.createReadStream('test_live.pdf'), { contentType: 'application/pdf' });
    const resPdf = await axios.post(`${LIVE_API_URL}/upload?type=material`, formPdf, { headers: { ...headers, ...formPdf.getHeaders() } });
    console.log('✅ PDF Uploaded:', resPdf.data.file.url);
    console.log('   Resource Type:', resPdf.data.file.resourceType);
    if (resPdf.data.file.resourceType !== 'raw') {
        throw new Error('PDF did not upload as raw resource type. Deployment might not be active yet.');
    }
    const pdfId = resPdf.data.file.publicId;

    // Test 3: Verify PDF URL opens
    console.log('\n▶ Test 3: Verify PDF URL (Live)');
    const verifyPdf = await axios.get(resPdf.data.file.url);
    console.log('✅ PDF URL opened successfully, status:', verifyPdf.status);

    // Test 4: Delete files on Live Server
    console.log('\n▶ Test 4: Delete Uploaded Files (Live)');
    const delJpg = await axios.delete(`${LIVE_API_URL}/upload`, { headers, data: { publicId: jpgId, resourceType: 'image' } });
    console.log('✅ JPG Deleted:', delJpg.data.message);
    const delPdf = await axios.delete(`${LIVE_API_URL}/upload`, { headers, data: { publicId: pdfId, resourceType: 'raw' } });
    console.log('✅ PDF Deleted:', delPdf.data.message);

    if (fs.existsSync('test_live.pdf')) fs.unlinkSync('test_live.pdf');
    mongoose.disconnect();
    console.log('\n🎉 ALL LIVE TESTS PASSED! RENDER DEPLOYMENT IS ACTIVE AND CORRECT.');
  } catch (err) {
    console.error('❌ Live Test Failed:', err.response?.data || err.message);
    mongoose.disconnect();
    process.exit(1);
  }
}

runLiveTests();
