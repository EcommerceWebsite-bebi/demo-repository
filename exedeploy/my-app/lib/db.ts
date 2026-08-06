import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';

interface RunResult {
  id: number;
  changes: number;
}

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || 'libsql://mouseee-binh123456.aws-ap-northeast-1.turso.io';
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3OTEyMjgxOTAsImlhdCI6MTc4NjA0NDE5MSwiaWQiOiIwMTlmZDg3ZS04ODAxLTc2ZGQtYjE3YS0yZjJhYzRiZTdhYTYiLCJraWQiOiJrbnVqTUtyMGNGaG94bEtYWmpXNEpIN19hdndSOHRlWW13UGJ3VHpDZEJjIiwicmlkIjoiNTc2NTIzNmYtZTE4Ny00OWVkLTgzZjAtMWFjN2Q0YTA5ZjcxIn0.ptvEfvD80WZkY2gIiUoO2CannxJIdytUvTseGZNPA_LmjTP0HdIv_tGQubxNUP1jiZ_ogyGGydKD3lpZtoiRDA';
const LOCAL_DB_URL = 'file:./backend/tshirt_shop.sqlite';
const SCHEMA_VERSION = '2026-07-14-daily-v1';

let activeClient = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});
let isUsingFallback = false;

function switchToLocalFallback(err: any) {
  if (!isUsingFallback) {
    console.warn('Turso Cloud auth failed (401). Switching to local SQLite database:', LOCAL_DB_URL);
    isUsingFallback = true;
    activeClient = createClient({ url: LOCAL_DB_URL });
  }
}

async function executeSql(stmt: { sql: string; args: any[] }) {
  try {
    return await activeClient.execute(stmt);
  } catch (err: any) {
    if (!isUsingFallback && (err?.status === 401 || err?.code === 'SERVER_ERROR' || String(err?.cause).includes('401') || String(err).includes('401'))) {
      switchToLocalFallback(err);
      return await activeClient.execute(stmt);
    }
    throw err;
  }
}

async function executeMultipleSql(sql: string) {
  try {
    return await activeClient.executeMultiple(sql);
  } catch (err: any) {
    if (!isUsingFallback && (err?.status === 401 || err?.code === 'SERVER_ERROR' || String(err?.cause).includes('401') || String(err).includes('401'))) {
      switchToLocalFallback(err);
      return await activeClient.executeMultiple(sql);
    }
    throw err;
  }
}

export const query = {
  async run(sql: string, params: any[] = []): Promise<RunResult> {
    await initializeDatabase();
    const res = await executeSql({ sql, args: params });
    return {
      id: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0,
      changes: res.rowsAffected
    };
  },
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    await initializeDatabase();
    const res = await executeSql({ sql, args: params });
    if (res.rows.length === 0) return undefined;
    return res.rows[0] as unknown as T;
  },
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await initializeDatabase();
    const res = await executeSql({ sql, args: params });
    return res.rows as unknown as T[];
  },
  async exec(sql: string): Promise<void> {
    await initializeDatabase();
    await executeMultipleSql(sql);
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
    // Turso persists between deployments. A single version lookup avoids
    // replaying every CREATE/ALTER/seed query on each server cold start.
    try {
      const version = await executeSql({
        sql: "SELECT value FROM app_metadata WHERE key = 'schema_version'",
        args: [],
      });
      if (version.rows[0]?.value === SCHEMA_VERSION) return;
    } catch {
      // First installation: app_metadata does not exist yet.
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

    await query.run(`
      CREATE TABLE IF NOT EXISTS daily_wallets (
        user_id INTEGER PRIMARY KEY,
        coins INTEGER NOT NULL DEFAULT 0,
        current_streak INTEGER NOT NULL DEFAULT 0,
        last_checkin_date TEXT DEFAULT NULL,
        total_gifts INTEGER NOT NULL DEFAULT 0,
        reminder_enabled INTEGER NOT NULL DEFAULT 0,
        reminder_time TEXT NOT NULL DEFAULT '09:00',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS daily_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        checkin_date TEXT NOT NULL,
        streak_day INTEGER NOT NULL,
        reward INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, checkin_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS daily_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        reward INTEGER NOT NULL,
        href TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS user_daily_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        task_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress',
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME DEFAULT NULL,
        UNIQUE(user_id, task_id, task_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE
      )
    `);

    const dailyTaskCount = await query.get<{ count: number }>('SELECT COUNT(*) as count FROM daily_tasks');
    if (dailyTaskCount && dailyTaskCount.count === 0) {
      await query.run(`
        INSERT INTO daily_tasks (code, title, description, reward, href, duration_seconds, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['browse', 'Lướt xem sản phẩm 30 giây', 'Khám phá sản phẩm yêu thích của bạn', 5, '/shop', 30, 1]);
      await query.run(`
        INSERT INTO daily_tasks (code, title, description, reward, href, duration_seconds, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['share', 'Chia sẻ sản phẩm cho bạn bè', 'Chia sẻ qua Zalo, Facebook hoặc liên kết', 5, '/shop', 20, 2]);
      await query.run(`
        INSERT INTO daily_tasks (code, title, description, reward, href, duration_seconds, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['profile', 'Hoàn thiện hồ sơ cá nhân', 'Cập nhật thông tin để nhận ưu đãi tốt hơn', 10, '/', 15, 3]);
    }

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

    await query.run(`
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query.run(`
      INSERT INTO app_metadata (key, value, updated_at)
      VALUES ('schema_version', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `, [SCHEMA_VERSION]);
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}

console.log('Connecting to Turso Cloud SQLite database at:', TURSO_DATABASE_URL);
initializeDatabase().catch((error) => {
  console.error('Error auto-initializing Turso database:', error);
});
