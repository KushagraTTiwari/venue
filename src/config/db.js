const { Pool } = require('pg');
require('dotenv').config();


const connectionString ="postgres://postgres:kush@localhost:5432/meetXDB?sslmode=disable"|| process.env.DB_URL;

const pool = new Pool({
  connectionString,
});

module.exports = pool;