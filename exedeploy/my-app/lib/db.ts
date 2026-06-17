import sqlite3Init from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';

interface RunResult {
  id: number;
  changes: number;
}

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || 'libsql://1-binh123456789.aws-eu-west-1.turso.io';
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3ODYwMTI2MzQsImlhdCI6MTc4MDgyODYzNCwiaWQiOiIwMTllYTFhMC0wODAxLTc1NGYtOGZjNi0wZTZiM2FmNDlhOTIiLCJyaWQiOiI1YzM4ZGU4Yy1hZmIwLTRhMTEtOTg4ZS05OTM0MTk1NDMyZmQifQ.e_rmJU_79n9D291a0i9XI7GuNIvghtSd3JVKui7T2Y760dq5zPe3XQztIZ4KF6yOOT6bCdFi1yM981pgCQJyDA';

const isTurso = !!TURSO_DATABASE_URL;

export let db: any = null;
let libsqlClient: any = null;

export const query = {
  async run(sql: string, params: any[] = []): Promise<RunResult> {
    await initializeDatabase();
    if (isTurso) {
      const res = await libsqlClient.execute({ sql, args: params });
      return {
        id: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0,
        changes: res.rowsAffected
      };
    } else {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, changes: this.changes });
          }
        });
      });
    }
  },
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    await initializeDatabase();
    if (isTurso) {
      const res = await libsqlClient.execute({ sql, args: params });
      if (res.rows.length === 0) return undefined;
      return res.rows[0] as unknown as T;
    } else {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err: any, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as T | undefined);
          }
        });
      });
    }
  },
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await initializeDatabase();
    if (isTurso) {
      const res = await libsqlClient.execute({ sql, args: params });
      return res.rows as unknown as T[];
    } else {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err: any, rows: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as T[]);
          }
        });
      });
    }
  },
  async exec(sql: string): Promise<void> {
    await initializeDatabase();
    if (isTurso) {
      await libsqlClient.executeMultiple(sql);
    } else {
      return new Promise((resolve, reject) => {
        db.exec(sql, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
};


let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

// Initialize and Setup Database Schema & Seed Data
export async function initializeDatabase() {
  if (isInitializing) return;
  if (!initializationPromise) {
    isInitializing = true;
    initializationPromise = (async () => {
      try {
        await runDatabaseInitialization();
      } finally {
        isInitializing = false;
      }
    })();
  }
  return initializationPromise;
}

async function runDatabaseInitialization() {
  try {
    // Enable Foreign Key support in SQLite (local only, remote Turso does not support PRAGMA)
    if (!isTurso) {
      await query.run('PRAGMA foreign_keys = ON');
    }

    // Create tables if they don't exist
    await query.run(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

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

    await query.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        discount_price DECIMAL(10,2) DEFAULT NULL,
        stock INTEGER DEFAULT 0,
        image TEXT,
        images TEXT DEFAULT NULL,
        category_id INTEGER,
        is_customizable INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS product_sizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        size_name TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        color_name TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

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

    await query.run(`
      CREATE TABLE IF NOT EXISTS order_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

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
    } catch (e) {
      // Column already exists, ignore error
    }

    try {
      await query.run('ALTER TABLE products ADD COLUMN discount_price DECIMAL(10,2) DEFAULT NULL');
    } catch (e) { }

    try {
      await query.run('ALTER TABLE products ADD COLUMN images TEXT DEFAULT NULL');
    } catch (e) { }

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

    await query.run(`
      CREATE TABLE IF NOT EXISTS visitor_stats (
        id INTEGER PRIMARY KEY,
        count INTEGER DEFAULT 0
      )
    `);

    // Seed default visitor count
    const visitorCount = await query.get<{ count: number }>('SELECT COUNT(*) as count FROM visitor_stats');
    if (visitorCount && visitorCount.count === 0) {
      await query.run('INSERT INTO visitor_stats (id, count) VALUES (1, 0)');
    }

    // Run migration alter queries to add coupon columns to orders table if they are missing
    try {
      await query.run('ALTER TABLE orders ADD COLUMN coupon_code TEXT');
    } catch (e) { }

    try {
      await query.run('ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0');
    } catch (e) { }

    // Seeding default coupons
    const couponsCount = await query.get<{ count: number }>('SELECT COUNT(*) as count FROM coupons');
    if (couponsCount && couponsCount.count === 0) {
      await query.run(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['WELCOME10', 'percentage', 10, 0, 100000, 100, 1]);

      await query.run(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['MOUSEEE50', 'fixed', 50000, 200000, null, 50, 1]);
    }

    // Seeding default roles
    const rolesCount = await query.get<{ count: number }>('SELECT COUNT(*) as count FROM roles');
    if (rolesCount && rolesCount.count === 0) {
      await query.run("INSERT INTO roles (name) VALUES ('USER')");
      await query.run("INSERT INTO roles (name) VALUES ('ADMIN')");
    }

    // Seeding default order statuses
    const statusCount = await query.get<{ count: number }>('SELECT COUNT(*) as count FROM order_status');
    if (statusCount && statusCount.count === 0) {
      await query.run("INSERT INTO order_status (name) VALUES ('PENDING')");
      await query.run("INSERT INTO order_status (name) VALUES ('PROCESSING')");
      await query.run("INSERT INTO order_status (name) VALUES ('SHIPPING')");
      await query.run("INSERT INTO order_status (name) VALUES ('COMPLETED')");
      await query.run("INSERT INTO order_status (name) VALUES ('CANCELLED')");
    }

    // Seeding default categories
    const categoriesCount = await query.get<{ count: number }>('SELECT COUNT(*) as count FROM categories');
    if (categoriesCount && categoriesCount.count === 0) {
      await query.run("INSERT INTO categories (name, description) VALUES ('Oversize', 'Oversize T-Shirt')");
      await query.run("INSERT INTO categories (name, description) VALUES ('Basic', 'Basic Cotton T-Shirt')");
      await query.run("INSERT INTO categories (name, description) VALUES ('Polo', 'Polo T-Shirt')");
      await query.run("INSERT INTO categories (name, description) VALUES ('Custom', 'Custom Design T-Shirt')");
    }

    // Seeding default admin user
    const adminCount = await query.get<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE email = 'admin@gmail.com'");
    if (adminCount && adminCount.count === 0) {
      const adminRole = await query.get<{ id: number }>("SELECT id FROM roles WHERE name = 'ADMIN'");
      const adminRoleId = adminRole ? adminRole.id : 2;
      const hashedPassword = await bcrypt.hash('123456', 10);

      const adminResult = await query.run(`
        INSERT INTO users (username, email, password, role_id)
        VALUES (?, ?, ?, ?)
      `, ['admin', 'admin@gmail.com', hashedPassword, adminRoleId]);

      // Seed an empty cart for admin
      await query.run('INSERT INTO carts (user_id) VALUES (?)', [adminResult.id]);
    }

    // Seeding sample products
    const productsCount = await query.get<{ count: number }>('SELECT COUNT(*) as count FROM products');
    if (productsCount && productsCount.count === 0) {
      const catOversize = await query.get<{ id: number }>("SELECT id FROM categories WHERE name = 'Oversize'");
      const catBasic = await query.get<{ id: number }>("SELECT id FROM categories WHERE name = 'Basic'");

      const idOversize = catOversize ? catOversize.id : 1;
      const idBasic = catBasic ? catBasic.id : 2;

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

      for (const size of ['S', 'M', 'L', 'XL']) {
        await query.run('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)', [p1Result.id, size]);
      }

      for (const size of ['M', 'L']) {
        await query.run('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)', [p2Result.id, size]);
      }

      for (const color of ['Black', 'White']) {
        await query.run('INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)', [p1Result.id, color]);
      }

      await query.run('INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)', [p2Result.id, 'White']);
    }
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}

if (isTurso) {
  console.log('Connecting to Turso Cloud SQLite database at:', TURSO_DATABASE_URL);
  libsqlClient = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  // Auto-initialize Turso database asynchronously
  initializeDatabase().catch((error) => {
    console.error('Error auto-initializing Turso database:', error);
  });
} else {
  const sqlite3 = sqlite3Init.verbose();
  
  // Detect Vercel deployment environment
  const isVercel = !!process.env.VERCEL;
  let dbPath = path.resolve(process.cwd(), process.env.DB_PATH || 'backend/tshirt_shop.sqlite');

  if (isVercel) {
    const vercelDbPath = '/tmp/tshirt_shop.sqlite';
    console.log('Detected Vercel environment. Checking /tmp/tshirt_shop.sqlite...');
    try {
      if (!fs.existsSync(vercelDbPath)) {
        if (fs.existsSync(dbPath)) {
          fs.copyFileSync(dbPath, vercelDbPath);
          console.log('Successfully copied SQLite database to /tmp/tshirt_shop.sqlite');
        } else {
          console.log('Source database not found at:', dbPath);
        }
      } else {
        console.log('Database already exists at /tmp/tshirt_shop.sqlite');
      }
      dbPath = vercelDbPath;
    } catch (err) {
      console.error('Failed to copy database to /tmp:', err);
    }
  }

  console.log('Connecting to local SQLite database at:', dbPath);

  // Ensure the directory for the SQLite file exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database successfully.');
      initializeDatabase().catch((error) => {
        console.error('Error auto-initializing database:', error);
      });
    }
  });
}
