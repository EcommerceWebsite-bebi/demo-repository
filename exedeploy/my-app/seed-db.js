const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('Error: TURSO_DATABASE_URL is not defined in .env');
  process.exit(1);
}

console.log('Connecting to Turso database at:', url);

const client = createClient({
  url: url,
  authToken: authToken,
});

async function seed() {
  try {
    console.log('Starting Turso database initialization...');

    // 1. Create tables
    await client.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);
    console.log('- Table "roles" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        phone TEXT,
        address TEXT,
        role_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);
    console.log('- Table "users" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);
    console.log('- Table "categories" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INTEGER DEFAULT 0,
        image TEXT,
        category_id INTEGER,
        is_customizable INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);
    console.log('- Table "products" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS product_sizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        size_name TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('- Table "product_sizes" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        color_name TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('- Table "product_colors" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('- Table "carts" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER,
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        size TEXT,
        color TEXT,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
    console.log('- Table "cart_items" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);
    console.log('- Table "order_status" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_price DECIMAL(10,2),
        status_id INTEGER,
        shipping_address TEXT,
        phone TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (status_id) REFERENCES order_status(id)
      )
    `);
    console.log('- Table "orders" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        price DECIMAL(10,2),
        size TEXT,
        color TEXT,
        custom_design_image TEXT,
        custom_design_pdf TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
    console.log('- Table "order_items" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('- Table "reviews" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        min_order_value DECIMAL(10,2) DEFAULT 0,
        max_discount DECIMAL(10,2) DEFAULT NULL,
        start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_date DATETIME DEFAULT NULL,
        usage_limit INTEGER DEFAULT NULL,
        used_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      )
    `);
    console.log('- Table "coupons" verified/created.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS visitor_stats (
        id INTEGER PRIMARY KEY,
        count INTEGER DEFAULT 0
      )
    `);
    console.log('- Table "visitor_stats" verified/created.');

    // Add new columns to order_items / orders if they don't exist
    try {
      await client.execute('ALTER TABLE order_items ADD COLUMN custom_design_pdf TEXT');
    } catch (e) {}
    try {
      await client.execute('ALTER TABLE orders ADD COLUMN coupon_code TEXT');
    } catch (e) {}
    try {
      await client.execute('ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0');
    } catch (e) {}

    // Seed data
    const visitorCount = await client.execute('SELECT COUNT(*) as count FROM visitor_stats');
    if (visitorCount.rows[0] && Number(visitorCount.rows[0].count) === 0) {
      await client.execute('INSERT INTO visitor_stats (id, count) VALUES (1, 0)');
      console.log('- Seeded visitor count.');
    }

    const couponsCount = await client.execute('SELECT COUNT(*) as count FROM coupons');
    if (couponsCount.rows[0] && Number(couponsCount.rows[0].count) === 0) {
      await client.execute(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active)
        VALUES ('WELCOME10', 'percentage', 10, 0, 100000, 100, 1)
      `);
      await client.execute(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active)
        VALUES ('MOUSEEE50', 'fixed', 50000, 200000, null, 50, 1)
      `);
      console.log('- Seeded coupons.');
    }

    const rolesCount = await client.execute('SELECT COUNT(*) as count FROM roles');
    if (rolesCount.rows[0] && Number(rolesCount.rows[0].count) === 0) {
      await client.execute("INSERT INTO roles (name) VALUES ('USER')");
      await client.execute("INSERT INTO roles (name) VALUES ('ADMIN')");
      console.log('- Seeded roles.');
    }

    const statusCount = await client.execute('SELECT COUNT(*) as count FROM order_status');
    if (statusCount.rows[0] && Number(statusCount.rows[0].count) === 0) {
      await client.execute("INSERT INTO order_status (name) VALUES ('PENDING')");
      await client.execute("INSERT INTO order_status (name) VALUES ('PROCESSING')");
      await client.execute("INSERT INTO order_status (name) VALUES ('SHIPPING')");
      await client.execute("INSERT INTO order_status (name) VALUES ('COMPLETED')");
      await client.execute("INSERT INTO order_status (name) VALUES ('CANCELLED')");
      console.log('- Seeded order statuses.');
    }

    const categoriesCount = await client.execute('SELECT COUNT(*) as count FROM categories');
    if (categoriesCount.rows[0] && Number(categoriesCount.rows[0].count) === 0) {
      await client.execute("INSERT INTO categories (name, description) VALUES ('Oversize', 'Oversize T-Shirt')");
      await client.execute("INSERT INTO categories (name, description) VALUES ('Basic', 'Basic Cotton T-Shirt')");
      await client.execute("INSERT INTO categories (name, description) VALUES ('Polo', 'Polo T-Shirt')");
      await client.execute("INSERT INTO categories (name, description) VALUES ('Custom', 'Custom Design T-Shirt')");
      console.log('- Seeded categories.');
    }

    // Admin user seed
    const adminCount = await client.execute("SELECT COUNT(*) as count FROM users WHERE email = 'admin@gmail.com'");
    if (adminCount.rows[0] && Number(adminCount.rows[0].count) === 0) {
      const adminRole = await client.execute("SELECT id FROM roles WHERE name = 'ADMIN'");
      const adminRoleId = adminRole.rows[0] ? Number(adminRole.rows[0].id) : 2;
      
      const hashedPassword = '$2a$10$r9/NqC8TeeFspu7D1r8mFeu0E7N1t0l5qU7d8S4p9H7J7R8p9m0oW'; // hash of '123456'
      
      const adminResult = await client.execute({
        sql: `
          INSERT INTO users (username, email, password, role_id)
          VALUES (?, ?, ?, ?)
        `,
        args: ['admin', 'admin@gmail.com', hashedPassword, adminRoleId]
      });

      const adminId = Number(adminResult.lastInsertRowid);
      await client.execute({
        sql: 'INSERT INTO carts (user_id) VALUES (?)',
        args: [adminId]
      });
      console.log('- Seeded admin user & admin cart.');
    }

    const productsCount = await client.execute('SELECT COUNT(*) as count FROM products');
    if (productsCount.rows[0] && Number(productsCount.rows[0].count) === 0) {
      const catOversize = await client.execute("SELECT id FROM categories WHERE name = 'Oversize'");
      const catBasic = await client.execute("SELECT id FROM categories WHERE name = 'Basic'");

      const idOversize = catOversize.rows[0] ? Number(catOversize.rows[0].id) : 1;
      const idBasic = catBasic.rows[0] ? Number(catBasic.rows[0].id) : 2;

      const p1Result = await client.execute({
        sql: `
          INSERT INTO products (name, description, price, stock, image, category_id, is_customizable)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          'Black Oversize T-Shirt',
          'Premium cotton oversize t-shirt',
          250000,
          100,
          'https://luonvuituoi.co/cdn/shop/files/navytr_c_623a3b46-d18d-4e05-a76c-ea95c05a8e5b.png?v=1750393504',
          idOversize,
          1
        ]
      });

      const p2Result = await client.execute({
        sql: `
          INSERT INTO products (name, description, price, stock, image, category_id, is_customizable)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          'White Basic T-Shirt',
          'Simple white basic shirt',
          350000,
          50,
          'https://bizweb.dktcdn.net/100/446/974/products/ao-thun-mlb-new-era-heavy-cotton-new-york-yankees-black-13086578-1.jpg?v=1691318321487',
          idBasic,
          0
        ]
      });

      const p1Id = Number(p1Result.lastInsertRowid);
      const p2Id = Number(p2Result.lastInsertRowid);

      for (const size of ['S', 'M', 'L', 'XL']) {
        await client.execute({
          sql: 'INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)',
          args: [p1Id, size]
        });
      }

      for (const size of ['M', 'L']) {
        await client.execute({
          sql: 'INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)',
          args: [p2Id, size]
        });
      }

      for (const color of ['Black', 'White']) {
        await client.execute({
          sql: 'INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)',
          args: [p1Id, color]
        });
      }

      await client.execute({
        sql: 'INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)',
        args: [p2Id, 'White']
      });

      console.log('- Seeded products, sizes, and colors.');
    }

    console.log('Turso database initialized successfully!');
  } catch (error) {
    console.error('Error seeding Turso database:', error);
  } finally {
    client.close();
  }
}

seed();
