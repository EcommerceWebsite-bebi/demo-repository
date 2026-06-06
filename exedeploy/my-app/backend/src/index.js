const app = require('./app');
const { initializeDatabase } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Initialize and Setup Database automatically on startup
    await initializeDatabase();

    // 2. Start Listening
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  Server is running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`  Local URL: http://localhost:${PORT}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
