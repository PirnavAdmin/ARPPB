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

async function testAll() {
  console.log('=== TEST 1: POST /api/v1/vendor/finished-products ===');
  try {
    const postRes = await api.post('/api/v1/vendor/finished-products', {
      productName: 'Guntur Red Chilli Powder',
      category: 'Spices & Condiments',
      sourceRawMaterial: 'Chilli',
      brandName: 'Praveen Agro Brand',
      packaging: '500g Pouch',
      initialQuantity: 25,
      unit: 'Kg',
      mfgDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 270 * 24 * 3600 * 1000).toISOString(),
      productionCost: 220,
      sellingPrice: 320,
      minThresholdQuantity: 5,
      imageUrl: null
    });
    console.log('Created Finished Product:', postRes.data);
  } catch (e) {
    console.error('Error creating finished product:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\n=== TEST 2: GET /api/v1/vendor/finished-products ===');
  try {
    const getRes = await api.get('/api/v1/vendor/finished-products');
    console.log('Products after creation:', getRes.data?.data);
  } catch (e) {
    console.error('Error getting finished products:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\n=== TEST 3: GET /api/v1/vendor/sales/batches ===');
  let batches = [];
  try {
    const batchRes = await api.get('/api/v1/vendor/sales/batches');
    batches = batchRes.data?.data || [];
    console.log('Batches returned for sales:', batches.length, batches);
  } catch (e) {
    console.error('Error getting batches:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\n=== TEST 4: GET /api/v1/vendor/sales/customers ===');
  let customers = [];
  try {
    const custRes = await api.get('/api/v1/vendor/sales/customers');
    customers = custRes.data?.data || [];
    console.log('Customers returned for sales:', customers.length, customers);
  } catch (e) {
    console.error('Error getting customers:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\n=== TEST 5: POST /api/v1/vendor/sales ===');
  try {
    const cust = customers[0] || { customerUserId: 1 };
    const batch = batches[0] || { id: 1 };
    console.log('Attempting sale with customerUserId:', cust.customerUserId, 'and batchId:', batch.id);

    const saleRes = await api.post('/api/v1/vendor/sales', {
      customerUserId: cust.customerUserId,
      deliveryAddress: 'Kurnool Market Yard',
      discountAmount: 0,
      taxAmount: 0,
      deliveryCharges: 0,
      otherCharges: 0,
      expectedDeliveryDate: new Date().toISOString(),
      expectedPaymentDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
      paymentTerms: 'Net 15 Days',
      notes: 'Sale test for praveen',
      items: [
        {
          finishedBatchId: batch.id,
          quantity: 2,
          pricePerUnit: 320
        }
      ],
      submit: true
    });
    console.log('Sale result:', saleRes.data);
  } catch (e) {
    console.error('Error creating sale:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\n=== TEST 6: GET /api/v1/vendor/sales ===');
  try {
    const salesRes = await api.get('/api/v1/vendor/sales');
    console.log('Sales list:', salesRes.data?.data?.items?.length || salesRes.data?.data?.length, salesRes.data?.data);
  } catch (e) {
    console.error('Error getting sales:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\n=== TEST 7: GET /api/v1/vendor/orders ===');
  try {
    const ordersRes = await api.get('/api/v1/vendor/orders');
    console.log('Orders list:', ordersRes.data?.data?.items?.length || ordersRes.data?.data?.length, ordersRes.data?.data);
  } catch (e) {
    console.error('Error getting orders:', e.response?.status, e.response?.data || e.message);
  }
}

testAll();
