const { Pool } = require('pg');
require('dotenv').config();


const connectionString = "postgres://shubup:password@localhost:5432/meetXDB";

const pool = new Pool({
  connectionString,
});

module.exports = pool;