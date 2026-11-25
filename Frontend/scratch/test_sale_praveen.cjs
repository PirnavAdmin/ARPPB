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

async function testSale() {
  try {
    console.log('Testing sale with batch 19 for Praveen...');
    const res = await api.post('/api/v1/vendor/sales', {
      customerUserId: 88, // Anil Kumar Sharma
      deliveryAddress: 'Flat 402, Green Meadows Residency, Hyderabad',
      discountAmount: 100,
      taxAmount: 50,
      deliveryCharges: 200,
      otherCharges: 0,
      expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      expectedPaymentDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
      paymentTerms: 'Net 15 Days',
      notes: 'Test sale with batch 19 for Praveen',
      items: [
        {
          finishedBatchId: 19,
          quantity: 2,
          pricePerUnit: 3500
        }
      ],
      submit: true
    });
    console.log('Sale Result:', res.data);

    console.log('\nTesting GET /api/v1/vendor/sales (Sales History)...');
    const salesRes = await api.get('/api/v1/vendor/sales');
    console.log('Sales history count:', salesRes.data?.data?.items?.length, salesRes.data?.data?.items);

    console.log('\nTesting GET /api/v1/vendor/orders (Customer Orders)...');
    const ordersRes = await api.get('/api/v1/vendor/orders');
    console.log('Customer orders count:', ordersRes.data?.data?.items?.length, ordersRes.data?.data?.items);
  } catch (e) {
    console.error('Error creating sale:', e.response?.status, e.response?.data || e.message);
  }
}

testSale();
