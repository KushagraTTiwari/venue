const createBookingTable = async (pool) => {
    const query = `
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(255) NOT NULL,
        venueid VARCHAR(255) NOT NULL,
        eventid VARCHAR(255) NOT NULL,
        paid_price DECIMAL(10, 2) NOT NULL,
        transaction_id VARCHAR(255) NOT NULL,
        timestamp VARCHAR(25)
      );`;
    try {
      await pool.query(query);
      console.log('Bookings table created or already exists');
    } catch (err) {
      console.error('Error creating bookings table:', err);
    }
  };
  
  module.exports = createBookingTable;
  