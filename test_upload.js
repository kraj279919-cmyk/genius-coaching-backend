const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    // create a dummy file
    const filePath = path.join(__dirname, 'dummy.txt');
    fs.writeFileSync(filePath, 'dummy content');

    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));

    // Notice we use form.getHeaders() which INCLUDES the boundary
    const headers = form.getHeaders();
    
    // Simulate what the mobile app does: overwrite with hardcoded multipart/form-data
    console.log('Sending with bad headers...');
    try {
      await axios.post('http://localhost:5000/api/upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data', 
          // No boundary!
        }
      });
    } catch(err) {
      console.log('Bad headers failed as expected:', err.response?.data || err.message);
    }

    console.log('\nSending with good headers (allowing boundary)...');
    try {
      const goodForm = new FormData();
      goodForm.append('image', fs.createReadStream(filePath));
      const res = await axios.post('http://localhost:5000/api/upload', goodForm, {
        headers: goodForm.getHeaders() // In Node we need this. In browser/React Native we just omit it or let Axios handle it.
      });
      console.log('Good headers success:', res.data);
    } catch(err) {
      console.log('Good headers failed:', err.response?.data || err.message);
    }

    fs.unlinkSync(filePath);
  } catch(e) {
    console.error(e);
  }
}

testUpload();
