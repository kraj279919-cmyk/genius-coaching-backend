const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

const testFullUploadPipeline = async () => {
  try {
    // 1. Get a token for student
    const loginRes = await axios.post(`${API_URL}/auth/login`, { identifier: 'rajgupta@gmail.com', password: 'Test@123' });
    const token = loginRes.data.token;
    
    // 2. Create a dummy image
    const tempFilePath = path.join(__dirname, 'dummy.txt');
    fs.writeFileSync(tempFilePath, 'dummy image content');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFilePath), {
      filename: 'dummy.jpg',
      contentType: 'image/jpeg',
    });
    
    // 3. Upload to /api/upload
    console.log('Uploading file...');
    const uploadRes = await axios.post(`${API_URL}/upload?type=profile`, form, {
      headers: { 
        ...form.getHeaders(),
        Authorization: `Bearer ${token}` 
      }
    });
    
    const data = uploadRes.data;
    console.log('Upload Result:', data);
    
    const uploadedUrl = data.fileUrl || data.profileImageUrl || data.url || data.secure_url || data.file?.url || data.data?.url;
    if (!uploadedUrl) throw new Error('No URL returned');
    console.log('URL Extracted:', uploadedUrl);
    
    // 4. Update Profile
    console.log('Updating profile...');
    const updateRes = await axios.put(`${API_URL}/auth/profile`, {
      profileImageUrl: uploadedUrl
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Update Result:', updateRes.data);
    
    fs.unlinkSync(tempFilePath);
    process.exit(0);
  } catch (error) {
    console.error('Fatal Test Error:', error.response?.data || error.message);
    process.exit(1);
  }
};

testFullUploadPipeline();
