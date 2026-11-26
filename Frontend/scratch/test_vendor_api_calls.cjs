const axios = require('axios');
const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createJwt(userId, name, role, secretBase64) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': String(userId),
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': name,
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': role,
    iss: 'ARPPB',
    aud: 'ARPPBUsers',
    nbf: now,
    exp: now + 7200,
    iat: now
  };

  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const secretKey = Buffer.from(secretBase64, 'base64');
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`${encHeader}.${encPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encHeader}.${encPayload}.${signature}`;
}

const secret = 'BkS7URZ9xwgbe5SXYHIrs6VNC7YANOPVv+NsNRb6yRQ=';
// Praveen: UserId 92
const token = createJwt(92, 'praveen', 'Vendor', secret);

console.log('JWT created for Praveen (UserId: 92)');

const api = axios.create({
  baseURL: 'https://zodiac-excursion-rendition.ngrok-free.dev',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  timeout: 15000
});

async function run() {
  try {
    console.log('\n--- 1. Testing GET /api/v1/vendor/finished-products ---');
    const getFpRes = await api.get('/api/v1/vendor/finished-products');
    console.log('GET finished-products status:', getFpRes.status, 'data length:', getFpRes.data?.data?.length);

    console.log('\n--- 2. Testing POST /api/v1/vendor/finished-products ---');
    const postFpBody = {
      productName: 'Chilli Powder Special',
      category: 'Spices & Condiments',
      sourceRawMaterial: 'Chilli',
      brandName: 'Rayalaseema Gold',
      packaging: '500g Pouch',
      initialQuantity: 50,
      unit: 'Kg',
      mfgDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      productionCost: 180,
      sellingPrice: 240,
      minThresholdQuantity: 10,
      imageUrl: null
    };
    const postFpRes = await api.post('/api/v1/vendor/finished-products', postFpBody);
    console.log('POST finished-products status:', postFpRes.status, 'result:', postFpRes.data);

    console.log('\n--- 3. Testing GET /api/v1/vendor/sales/batches ---');
    const batchesRes = await api.get('/api/v1/vendor/sales/batches');
    console.log('GET sales/batches status:', batchesRes.status, 'data length:', batchesRes.data?.data?.length, batchesRes.data?.data);

    console.log('\n--- 4. Testing GET /api/v1/vendor/sales/customers ---');
    const custRes = await api.get('/api/v1/vendor/sales/customers');
    console.log('GET sales/customers status:', custRes.status, 'customers:', custRes.data?.data);

    console.log('\n--- 5. Testing POST /api/v1/vendor/sales ---');
    const firstBatch = batchesRes.data?.data?.[0];
    const firstCust = custRes.data?.data?.[0];
    console.log('Using batch:', firstBatch, 'and customer:', firstCust);

    const saleBody = {
      customerUserId: firstCust?.customerUserId || 1,
      deliveryAddress: 'Main Bazar, Kurnool',
      discountAmount: 0,
      taxAmount: 0,
      deliveryCharges: 0,
      otherCharges: 0,
      expectedDeliveryDate: new Date().toISOString(),
      expectedPaymentDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      paymentTerms: 'Net 15 Days',
      notes: 'Test sale for praveen',
      items: [
        {
          finishedBatchId: firstBatch?.id || 1,
          quantity: 2,
          pricePerUnit: 240
        }
      ],
      submit: true
    };
    const postSaleRes = await api.post('/api/v1/vendor/sales', saleBody);
    console.log('POST sales status:', postSaleRes.status, 'result:', postSaleRes.data);

  } catch (err) {
    console.error('API Error:', err.response?.status, err.response?.data || err.message);
  }
}

run();
