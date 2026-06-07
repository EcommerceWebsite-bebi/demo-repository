const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("URL:", url);

const client = createClient({ url, authToken });

async function main() {
  try {
    const res = await client.execute("SELECT * FROM visitor_stats WHERE id = 1");
    console.log("Result rows:", res.rows);
    if (res.rows.length > 0) {
      console.log("Row 0 keys:", Object.keys(res.rows[0]));
      console.log("Row 0 count:", res.rows[0].count);
      console.log("Row 0 values:", Object.values(res.rows[0]));
      console.log("Row 0 JSON:", JSON.stringify(res.rows[0]));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
