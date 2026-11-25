const crypto = require('crypto');
const axios = require('axios');

function createToken(userId, fullName, role, mobile, email) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + 7200;
  const payload = {
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': String(userId),
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': fullName,
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': role,
    Mobile: mobile,
    exp: exp,
    iss: 'ARPPB',
    aud: 'ARPPBUsers'
  };
  if (email) payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] = email;

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const h = b64(header);
  const p = b64(payload);
  const secretKey = Buffer.from('BkS7URZ9xwgbe5SXYHIrs6VNC7YANOPVv+NsNRb6yRQ=', 'base64');
  const sig = crypto.createHmac('sha256', secretKey).update(h + '.' + p).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return h + '.' + p + '.' + sig;
}

const token = createToken(92, 'praveen', 'Vendor', '6161616161', 'praveen@gmail.com');

const api = axios.create({
  baseURL: 'https://zodiac-excursion-rendition.ngrok-free.dev',
  headers: {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  timeout: 15000
});

async function testProcessing() {
  try {
    console.log('Testing GET raw materials for Praveen...');
    const rawRes = await api.get('/api/v1/vendor/inventory');
    console.log('Raw inventory:', rawRes.data?.data);

    console.log('Testing create processing batch for Praveen...');
    const procRes = await api.post('/api/v1/vendor/processing/batches', {
      rawMaterialName: 'Chilli',
      sourceStockId: rawRes.data?.data?.[0]?.stockId || 'STK-0001',
      inputQuantity: 10,
      unit: 'Quintal',
      processingExpenses: 1500,
      notes: 'Processing Chilli into Chilli Powder',
      outputs: [
        {
          outputProductName: 'Chilli Powder Grade A',
          outputQuantity: 9,
          unit: 'Quintal',
          outputType: 'Main Product'
        }
      ]
    });
    console.log('Processing batch created:', procRes.data);
  } catch (e) {
    console.error('Error in processing:', e.response?.status, e.response?.data || e.message);
  }
}

testProcessing();
