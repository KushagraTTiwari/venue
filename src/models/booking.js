const createBookingTable = async (pool) => {
    const query = `
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        userid UUID NOT NULL,
        venueid UUID NOT NULL,
        eventid UUID NOT NULL,
        paid_price DECIMAL(10, 2) NOT NULL,
        transaction_id UUID NOT NULL,
      );
    `;
    try {
      await pool.query(query);
      console.log('Bookings table created or already exists');
    } catch (err) {
      console.error('Error creating bookings table:', err);
    }
  };
  
  module.exports = createBookingTable;
  