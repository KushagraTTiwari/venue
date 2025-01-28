// consumers/userTrackConsumer.js
const { kafka } = require('../config/kafka');
const pool = require('../config/db');
const { getResponse, deleteResponse } = require('../utils/responseMap');

// Process user track message
const processUserTrackMessage = async (message, Id) => {
    const { userId, venueId, eventId, paid_price, transaction_Id, timestamp } = message;
    const key = Id ? Id.toString() : 'undefined';
    const res = getResponse(key);
  try{
    // Ensure transaction ID is unique
    const existingTransaction = await pool.query(
        'SELECT id FROM bookings WHERE transaction_id = $1',
        [transaction_Id]
      );
      if (existingTransaction.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID already exists'
        });
      }

       // Insert booking into the database
    const query = `
    INSERT INTO bookings (userid, venueid, eventid, paid_price, transaction_id, transaction_time)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [userId, venueId, eventId, paid_price, transaction_Id, timestamp];

  const result = await pool.query(query, values);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: result.rows[0]
  });
} catch (error) {
  console.error('Database error:', error);
  res.status(500).send({ error: 'Failed to track click' });
} finally {
    deleteResponse(Id);
  }
};

// Main consumer setup and message handler
const setupUserBookingConsumer = async (consumer, producer) => {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const messageValue = JSON.parse(message.value.toString());
        await processUserTrackMessage(messageValue, message.key);
        console.info('User track message processed:', messageValue);
      } catch (error) {
        console.error('Error processing user track message:', error);
      }
    }
  });
};

// Initialize and start the user track consumer
const initializeUserBookingProducerConsumer = async () => {
  const consumer = kafka.consumer({ groupId: 'user-booking-group' });
  const producer = kafka.producer();

  try {
    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topics: ['user-bokking-requests'] });
    await setupUserBookingConsumer(consumer, producer);

    console.info('User Booking Consumer started successfully');
    return { consumer, producer };
  } catch (error) {
    console.error('Error starting user booking consumer:', error);
    throw error;
  }
};

// Shutdown function
const shutdownUserBookingProducerConsumer = async (consumer, producer) => {
  try {
    await consumer.disconnect();
    await producer.disconnect();
    console.info('User Track consumer shutdown successfully');
  } catch (error) {
    console.error('Error during consumer shutdown:', error);
    throw error;
  }
};

module.exports = {
  initializeUserBookingProducerConsumer,
  shutdownUserBookingProducerConsumer
};
