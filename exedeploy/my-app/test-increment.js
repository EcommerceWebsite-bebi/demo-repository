const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function main() {
  try {
    const visitor = await client.execute({ sql: 'SELECT count FROM visitor_stats WHERE id = 1', args: [] });
    console.log("Before visitor row:", visitor.rows[0]);
    
    let newCount = 126;
    if (visitor.rows.length === 0) {
      await client.execute({ sql: 'INSERT INTO visitor_stats (id, count) VALUES (1, 126)', args: [] });
    } else {
      newCount = visitor.rows[0].count + 1;
      await client.execute({ sql: 'UPDATE visitor_stats SET count = ? WHERE id = 1', args: [newCount] });
    }
    
    const updated = await client.execute({ sql: 'SELECT count FROM visitor_stats WHERE id = 1', args: [] });
    console.log("After visitor row:", updated.rows[0]);
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
