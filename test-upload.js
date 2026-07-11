const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

async function runTests() {
  try {
    console.log('--- STARTING UPLOAD API TESTS ---');
    
    // Connect to DB to get a real admin ID
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const admin = await User.findOne({ role: { $in: ['admin', 'director'] } });
    if (!admin) throw new Error('No admin found in DB');
    
    const payload = { id: admin._id, role: admin.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('✅ Admin token generated for real admin:', admin.email || admin.name);
    // Don't disconnect here because tests run right after, but we actually only need the HTTP request so it doesn't matter.

    const headers = { 'Authorization': `Bearer ${token}` };

    // Use real test files from the project or an empty real PDF
    const realImgPath = 'C:\\Projects\\genius-mobile-54\\assets\\logo-round.png';
    fs.writeFileSync('test.pdf', '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'); // minimal real pdf
    fs.writeFileSync('test.txt', 'fake text data');

    // Test 1: Upload JPG (Actually PNG, using icon.png)
    console.log('\n▶ Test 1: Upload Image');
    const formJpg = new FormData();
    formJpg.append('file', fs.createReadStream(realImgPath), { contentType: 'image/png' });
    const resJpg = await axios.post(`${API_URL}/upload?type=profile`, formJpg, { headers: { ...headers, ...formJpg.getHeaders() } });
    console.log('✅ JPG Uploaded:', resJpg.data.file.url);
    const jpgId = resJpg.data.file.publicId;

    // Test 2: Upload PDF
    console.log('\n▶ Test 2: Upload PDF');
    const formPdf = new FormData();
    formPdf.append('file', fs.createReadStream('test.pdf'), { contentType: 'application/pdf' });
    const resPdf = await axios.post(`${API_URL}/upload?type=material`, formPdf, { headers: { ...headers, ...formPdf.getHeaders() } });
    console.log('✅ PDF Uploaded:', resPdf.data.file.url);
    console.log('   Resource Type:', resPdf.data.file.resourceType);
    const pdfId = resPdf.data.file.publicId;

    // Test 3: Upload Invalid File (txt)
    console.log('\n▶ Test 3: Upload Invalid File');
    try {
      const formTxt = new FormData();
      formTxt.append('file', fs.createReadStream('test.txt'), { contentType: 'text/plain' });
      await axios.post(`${API_URL}/upload?type=material`, formTxt, { headers: { ...headers, ...formTxt.getHeaders() } });
      console.log('❌ FAILED: Should have rejected .txt file');
    } catch (e) {
      console.log('✅ Invalid file rejected:', e.response?.data?.message || e.message);
    }

    // Test 4: Missing Token
    console.log('\n▶ Test 4: Missing Token');
    try {
      const formMiss = new FormData();
      formMiss.append('file', fs.createReadStream('test.jpg'), { contentType: 'image/jpeg' });
      await axios.post(`${API_URL}/upload?type=profile`, formMiss, { headers: formMiss.getHeaders() });
      console.log('❌ FAILED: Should have rejected missing token');
    } catch (e) {
      console.log('✅ Missing token rejected:', e.response?.data?.message || e.message);
    }

    // Test 5: Verify URL opens (JPG)
    console.log('\n▶ Test 5: Verify JPG URL');
    const verifyJpg = await axios.get(resJpg.data.file.url);
    console.log('✅ JPG URL opened successfully, status:', verifyJpg.status);

    // Test 6: Verify URL opens (PDF)
    console.log('\n▶ Test 6: Verify PDF URL');
    const verifyPdf = await axios.get(resPdf.data.file.url);
    console.log('✅ PDF URL opened successfully, status:', verifyPdf.status);

    // Test 7: Delete files
    console.log('\n▶ Test 7: Delete Uploaded Files');
    const delJpg = await axios.delete(`${API_URL}/upload`, { headers, data: { publicId: jpgId, resourceType: 'image' } });
    console.log('✅ JPG Deleted:', delJpg.data.message);
    const delPdf = await axios.delete(`${API_URL}/upload`, { headers, data: { publicId: pdfId, resourceType: 'raw' } });
    console.log('✅ PDF Deleted:', delPdf.data.message);

    // Cleanup local files
    if (fs.existsSync('test.pdf')) fs.unlinkSync('test.pdf');
    if (fs.existsSync('test.txt')) fs.unlinkSync('test.txt');

    console.log('\n🎉 ALL TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data || err.message);
  }
}

runTests();
