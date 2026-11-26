const axios = require('axios');

async function testLogin() {
  const api = axios.create({
    baseURL: 'https://zodiac-excursion-rendition.ngrok-free.dev',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    }
  });

  // Try logging in with Praveen's mobile or test vendor
  const candidates = [
    { identifier: '6161616161', password: 'Password@2026' },
    { identifier: '6161616161', password: 'Test@1234' },
    { identifier: 'praveen@gmail.com', password: 'Password@2026' },
    { identifier: 'praveen@gmail.com', password: 'Test@1234' },
    { identifier: '9876500004', password: 'Test@1234' }
  ];

  for (const c of candidates) {
    try {
      const res = await api.post('/api/v1/auth/login', {
        identifier: c.identifier,
        password: c.password
      });
      console.log('Login SUCCESS for', c.identifier, 'Token:', res.data?.data?.token?.slice(0, 30) + '...');
      console.log('User data:', res.data?.data?.user);
      return res.data?.data?.token;
    } catch (e) {
      console.log('Login failed for', c.identifier, c.password, e.response?.data?.message || e.message);
    }
  }
}

testLogin();
