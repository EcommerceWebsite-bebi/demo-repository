const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper delay function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('=== Starting E-Commerce API Test Runner ===');

  // 1. Delete database if exists to ensure clean run
  const dbFile = path.resolve(__dirname, './tshirt_shop.sqlite');
  if (fs.existsSync(dbFile)) {
    try {
      fs.unlinkSync(dbFile);
      console.log('Cleaned old SQLite database.');
    } catch (e) {
      console.log('Could not clean old database, continuing...', e.message);
    }
  }

  // 2. Start backend server as a background process
  const serverProcess = spawn('node', ['src/index.js'], {
    cwd: __dirname,
    stdio: 'pipe',
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data.toString().trim()}`);
  });

  // Wait for server to start up and print connection messages
  console.log('Waiting for server to initialize...');
  await sleep(4000);

  let exitCode = 0;

  try {
    // --- 1. Base API check ---
    console.log('\n--- 1. Testing Base API Status ---');
    const baseRes = await fetch(`${BASE_URL}/`);
    const baseJson = await baseRes.json();
    console.log('Base API Response:', baseJson);
    if (!baseJson.success) throw new Error('Base API failed');

    // --- 2. Admin Login ---
    console.log('\n--- 2. Testing Admin Login ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: '123456' }),
    });
    const adminLoginJson = await adminLoginRes.json();
    console.log('Admin Login Response:', adminLoginJson);
    if (!adminLoginJson.success || !adminLoginJson.token) {
      throw new Error('Admin login failed');
    }
    const adminToken = adminLoginJson.token;

    // --- 3. Get Categories ---
    console.log('\n--- 3. Testing Get Categories ---');
    const catRes = await fetch(`${BASE_URL}/api/products/categories`);
    const catJson = await catRes.json();
    console.log('Categories Count:', catJson.categories?.length, catJson.categories);
    if (!catJson.success || catJson.categories.length === 0) throw new Error('Get categories failed');

    // --- 4. Get Products ---
    console.log('\n--- 4. Testing Get Products ---');
    const prodRes = await fetch(`${BASE_URL}/api/products`);
    const prodJson = await prodRes.json();
    console.log('Products Count:', prodJson.count);
    if (!prodJson.success || prodJson.count === 0) throw new Error('Get products failed');

    const products = prodJson.products;
    const p1 = products.find(p => p.name.includes('Black Oversize'));
    const p2 = products.find(p => p.name.includes('White Basic'));
    console.log(`Product 1 (Customizable: ${p1?.is_customizable}): ${p1?.name} - Sizes: ${p1?.sizes?.join(', ')} - Colors: ${p1?.colors?.join(', ')}`);
    console.log(`Product 2 (Customizable: ${p2?.is_customizable}): ${p2?.name} - Sizes: ${p2?.sizes?.join(', ')} - Colors: ${p2?.colors?.join(', ')}`);

    // --- 5. Register Customer ---
    console.log('\n--- 5. Testing Customer Registration ---');
    const customerEmail = `customer-${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'John Doe',
        email: customerEmail,
        password: 'password123',
        phone: '0123456789',
        address: '789 Elm Street'
      }),
    });
    const regJson = await regRes.json();
    console.log('Register Response:', regJson);
    if (!regJson.success || !regJson.token) throw new Error('Customer registration failed');
    const customerToken = regJson.token;
    const customerId = regJson.user.id;

    // --- 6. Add Items to Cart ---
    console.log('\n--- 6. Testing Add Items to Cart ---');
    // Add 2 Black Oversize T-Shirts
    const cartAdd1Res = await fetch(`${BASE_URL}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        product_id: p1.id,
        quantity: 2,
        size: 'M',
        color: 'Black'
      })
    });
    const cartAdd1Json = await cartAdd1Res.json();

    // Add 1 White Basic T-Shirt
    const cartAdd2Res = await fetch(`${BASE_URL}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        product_id: p2.id,
        quantity: 1,
        size: 'L',
        color: 'White'
      })
    });
    const cartAdd2Json = await cartAdd2Res.json();
    console.log('Cart after adding products:', JSON.stringify(cartAdd2Json.cart, null, 2));
    // Expected total price: 500000 * 2 + 350000 * 1 = 1350000
    if (cartAdd2Json.cart.total_price !== 1350000) {
      throw new Error(`Expected cart total price 1350000 but got ${cartAdd2Json.cart.total_price}`);
    }

    // --- 7. Verify Product Stock Prior to Checkout ---
    console.log('\n--- 7. Checking stock before order ---');
    const p1Before = await (await fetch(`${BASE_URL}/api/products/${p1.id}`)).json();
    const p2Before = await (await fetch(`${BASE_URL}/api/products/${p2.id}`)).json();
    console.log(`Stock before order: ${p1Before.product.name} = ${p1Before.product.stock}, ${p2Before.product.name} = ${p2Before.product.stock}`);

    // --- 8. Checkout Cart ---
    console.log('\n--- 8. Testing Cart Checkout ---');
    const checkoutRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        shipping_address: '123 Delivery Lane',
        phone: '0909090909',
        note: 'Please deliver after 5 PM'
      })
    });
    const checkoutJson = await checkoutRes.json();
    console.log('Checkout Response:', checkoutJson);
    if (!checkoutJson.success) throw new Error('Checkout failed');
    const orderId = checkoutJson.order.id;

    // --- 9. Verify Cart is Cleared & Stock is Deducted ---
    console.log('\n--- 9. Verifying Cart Empty & Stock Deducted ---');
    const getCartRes = await fetch(`${BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const getCartJson = await getCartRes.json();
    console.log('User Cart after checkout (should be empty):', getCartJson.cart.items);
    if (getCartJson.cart.items.length !== 0) throw new Error('Cart not cleared after checkout');

    const p1After = await (await fetch(`${BASE_URL}/api/products/${p1.id}`)).json();
    const p2After = await (await fetch(`${BASE_URL}/api/products/${p2.id}`)).json();
    console.log(`Stock after order: ${p1After.product.name} = ${p1After.product.stock} (expected 98), ${p2After.product.name} = ${p2After.product.stock} (expected 49)`);
    if (p1After.product.stock !== 98 || p2After.product.stock !== 49) {
      throw new Error('Stocks were not correctly decremented');
    }

    // --- 10. Submit a Product Review ---
    console.log('\n--- 10. Testing Submitting Product Review ---');
    const reviewRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        product_id: p1.id,
        rating: 5,
        comment: 'Love the premium oversize fit! Highly recommend.'
      })
    });
    const reviewJson = await reviewRes.json();
    console.log('Review Response:', reviewJson);
    if (!reviewJson.success) throw new Error('Create review failed');

    // --- 11. Retrieve Product details with nested review ---
    console.log('\n--- 11. Verifying Review Nesting on Product Detail ---');
    const checkProductRes = await fetch(`${BASE_URL}/api/products/${p1.id}`);
    const checkProductJson = await checkProductRes.json();
    console.log('Product Details with Reviews:', JSON.stringify(checkProductJson.product.reviews, null, 2));
    if (checkProductJson.product.reviews.length === 0 || checkProductJson.product.reviews[0].comment !== 'Love the premium oversize fit! Highly recommend.') {
      throw new Error('Review was not nested inside product detail');
    }

    // --- 12. Admin Updates Order Status (Shipping) ---
    console.log('\n--- 12. Testing Admin Order Status Update (SHIPPING) ---');
    const updateStatusRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status_id: 3 }) // 3 = SHIPPING
    });
    const updateStatusJson = await updateStatusRes.json();
    console.log('Update Status Response:', updateStatusJson);
    if (!updateStatusJson.success || updateStatusJson.order.status_name !== 'SHIPPING') {
      throw new Error('Update order status failed');
    }

    // --- 13. Admin Cancels Order & Restores Stock ---
    console.log('\n--- 13. Testing Admin Cancels Order & Restores Stock ---');
    const cancelRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status_id: 5 }) // 5 = CANCELLED
    });
    const cancelJson = await cancelRes.json();
    console.log('Cancel Order Response:', cancelJson);

    const p1Cancelled = await (await fetch(`${BASE_URL}/api/products/${p1.id}`)).json();
    const p2Cancelled = await (await fetch(`${BASE_URL}/api/products/${p2.id}`)).json();
    console.log(`Stock after cancellation: ${p1Cancelled.product.name} = ${p1Cancelled.product.stock} (expected 100), ${p2Cancelled.product.name} = ${p2Cancelled.product.stock} (expected 50)`);
    if (p1Cancelled.product.stock !== 100 || p2Cancelled.product.stock !== 50) {
      throw new Error('Stocks were not correctly restored on cancellation');
    }

    console.log('\n==================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ TEST RUNNER FAILED:', error.message);
    exitCode = 1;
  } finally {
    console.log('\nStopping backend server...');
    serverProcess.kill();
    await sleep(1500);
    process.exit(exitCode);
  }
}

runTests();
