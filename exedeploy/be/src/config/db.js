const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbPath = path.resolve(process.env.DB_PATH || './tshirt_shop.sqlite');
console.log('Connecting to database at:', dbPath);

// Ensure the directory for the SQLite file exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database successfully.');
  }
});

// Helper functions to wrap sqlite3 methods in Promises
const query = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

// Initialize and Setup Database Schema & Seed Data
async function initializeDatabase() {
  try {
    // Enable Foreign Key support in SQLite
    await query.run('PRAGMA foreign_keys = ON');

    // 1. Create tables if they don't exist
    console.log('Initializing database schema...');

    // roles table
    await query.run(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    // users table
    await query.run(`
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

    // categories table
    await query.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);

    // products table
    await query.run(`
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

    // product_sizes table
    await query.run(`
      CREATE TABLE IF NOT EXISTS product_sizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        size_name TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // product_colors table
    await query.run(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        color_name TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // carts table
    await query.run(`
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // cart_items table
    await query.run(`
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

    // order_status table
    await query.run(`
      CREATE TABLE IF NOT EXISTS order_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    // orders table
    await query.run(`
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

    // order_items table
    await query.run(`
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

    // Run migration alter query to add custom_design_pdf if it's missing in existing database
    try {
      await query.run('ALTER TABLE order_items ADD COLUMN custom_design_pdf TEXT');
      console.log('Successfully added custom_design_pdf column to order_items via migration.');
    } catch (e) {
      // Column already exists, ignore error
    }

    // reviews table
    await query.run(`
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

    // coupons table
    await query.run(`
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

    // Run migration alter queries to add coupon columns to orders table if they are missing
    try {
      await query.run('ALTER TABLE orders ADD COLUMN coupon_code TEXT');
      console.log('Successfully added coupon_code column to orders table via migration.');
    } catch (e) {
      // Column already exists, ignore error
    }

    try {
      await query.run('ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0');
      console.log('Successfully added discount_amount column to orders table via migration.');
    } catch (e) {
      // Column already exists, ignore error
    }

    console.log('Database tables verified/created.');

    // Seeding default coupons
    const couponsCount = await query.get('SELECT COUNT(*) as count FROM coupons');
    if (couponsCount.count === 0) {
      console.log('Seeding default coupons (WELCOME10, MOUSEEE50)...');
      await query.run(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['WELCOME10', 'percentage', 10, 0, 100000, 100, 1]);

      await query.run(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['MOUSEEE50', 'fixed', 50000, 200000, null, 50, 1]);
    }

    // 2. Seeding default roles
    const rolesCount = await query.get('SELECT COUNT(*) as count FROM roles');
    if (rolesCount.count === 0) {
      console.log('Seeding default roles (USER, ADMIN)...');
      await query.run("INSERT INTO roles (name) VALUES ('USER')");
      await query.run("INSERT INTO roles (name) VALUES ('ADMIN')");
    }

    // 3. Seeding default order statuses
    const statusCount = await query.get('SELECT COUNT(*) as count FROM order_status');
    if (statusCount.count === 0) {
      console.log('Seeding default order statuses...');
      await query.run("INSERT INTO order_status (name) VALUES ('PENDING')");
      await query.run("INSERT INTO order_status (name) VALUES ('PROCESSING')");
      await query.run("INSERT INTO order_status (name) VALUES ('SHIPPING')");
      await query.run("INSERT INTO order_status (name) VALUES ('COMPLETED')");
      await query.run("INSERT INTO order_status (name) VALUES ('CANCELLED')");
    }

    // 4. Seeding default categories
    const categoriesCount = await query.get('SELECT COUNT(*) as count FROM categories');
    if (categoriesCount.count === 0) {
      console.log('Seeding categories...');
      await query.run("INSERT INTO categories (name, description) VALUES ('Oversize', 'Oversize T-Shirt')");
      await query.run("INSERT INTO categories (name, description) VALUES ('Basic', 'Basic Cotton T-Shirt')");
      await query.run("INSERT INTO categories (name, description) VALUES ('Polo', 'Polo T-Shirt')");
      await query.run("INSERT INTO categories (name, description) VALUES ('Custom', 'Custom Design T-Shirt')");
    }

    // 5. Seeding default admin user
    const adminCount = await query.get("SELECT COUNT(*) as count FROM users WHERE email = 'admin@gmail.com'");
    if (adminCount.count === 0) {
      console.log('Seeding default admin user...');
      const adminRole = await query.get("SELECT id FROM roles WHERE name = 'ADMIN'");
      const adminRoleId = adminRole ? adminRole.id : 2;
      const hashedPassword = await bcrypt.hash('123456', 10);

      const adminResult = await query.run(`
        INSERT INTO users (username, email, password, role_id)
        VALUES (?, ?, ?, ?)
      `, ['admin', 'admin@gmail.com', hashedPassword, adminRoleId]);

      // Seed an empty cart for admin
      await query.run('INSERT INTO carts (user_id) VALUES (?)', [adminResult.id]);
    }

    // 6. Seeding sample products
    const productsCount = await query.get('SELECT COUNT(*) as count FROM products');
    if (productsCount.count === 0) {
      console.log('Seeding sample products...');

      // Get category IDs
      const catOversize = await query.get("SELECT id FROM categories WHERE name = 'Oversize'");
      const catBasic = await query.get("SELECT id FROM categories WHERE name = 'Basic'");

      const idOversize = catOversize ? catOversize.id : 1;
      const idBasic = catBasic ? catBasic.id : 2;

      // Insert products
      const p1Result = await query.run(`
        INSERT INTO products (name, description, price, stock, image, category_id, is_customizable)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'Black Oversize T-Shirt',
        'Premium cotton oversize t-shirt',
        250000,
        100,
        'https://luonvuituoi.co/cdn/shop/files/navytr_c_623a3b46-d18d-4e05-a76c-ea95c05a8e5b.png?v=1750393504',
        idOversize,
        1
      ]);

      const p2Result = await query.run(`
        INSERT INTO products (name, description, price, stock, image, category_id, is_customizable)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'White Basic T-Shirt',
        'Simple white basic shirt',
        350000,
        50,
        'https://bizweb.dktcdn.net/100/446/974/products/ao-thun-mlb-new-era-heavy-cotton-new-york-yankees-black-13086578-1.jpg?v=1691318321487',
        idBasic,
        0
      ]);

      // Product 1 Sizes: S, M, L, XL
      for (const size of ['S', 'M', 'L', 'XL']) {
        await query.run('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)', [p1Result.id, size]);
      }

      // Product 2 Sizes: M, L
      for (const size of ['M', 'L']) {
        await query.run('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)', [p2Result.id, size]);
      }

      // Product 1 Colors: Black, White
      for (const color of ['Black', 'White']) {
        await query.run('INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)', [p1Result.id, color]);
      }

      // Product 2 Colors: White
      await query.run('INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)', [p2Result.id, 'White']);

      console.log('Seeding completed successfully.');
    }

    console.log('Database initialization completed.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
}

module.exports = {
  db,
  query,
  initializeDatabase
};
