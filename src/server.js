const express = require('express');
const { initializeProducerConsumer, shutdownProducerConsumer } = require('./consumers/venueConsumer');
const { initializeUserBookingProducerConsumer, shutdownUserBookingProducerConsumer } = require('./consumers/userBokkkingConsumer');
const { initializeUserTrackConsumer, shutdownUserTrackConsumer } = require('./consumers/userTrackConsumer');
const venueRoutes = require('./routes/venueRoutes');
const userRoutes = require('./routes/userTrackRoute');
const pool = require('./config/db');
const createActivityTable = require('./models/activity');
const createVenueTable = require('./models/venue');
const createReviewTable = require('./models/review');
const createUserTrackTable = require('./models/userTrack')
const createBookingTable = require('./models/booking')
require('dotenv').config();
const app = express();
const { kafka } = require("./config/kafka");

app.use(express.json());

//DB Coonection
pool.connect().then(() => console.log('Connected to PostgreSQL database')).catch((err) => console.error('Database connection error:', err.stack));

//Create Activity Table
createActivityTable(pool);
createVenueTable(pool);
createReviewTable(pool);
createUserTrackTable(pool);
createBookingTable(pool);

async function init() {
  const admin = kafka.admin();
  console.log("Admin connecting...");
  admin.connect();
  console.log("Adming Connection Success...");

  console.log("Creating Topic venue-requests");
  
  try {
    await admin.createTopics({
      topics: [
        { topic: "venue-requests", numPartitions: 1 },
        { topic: "user-track-requests", numPartitions: 1 },
        { topic: "user-booking-requests", numPartitions: 1 }
      ],
    });
    console.log("Topic created successfully");
  } catch (error) {
    if (error.type === "TOPIC_ALREADY_EXISTS") {
      console.log("Topic already exists, skipping creation");
    } else {
      throw error;
    }
  }

  console.log("Disconnecting Admin..");
  await admin.disconnect();
}

init();

// Initialize consumer on server start
const startConsumer = async () => {
  const { consumer, producer } = await initializeProducerConsumer();
  const { userTrackconsumer, userTrackproducer } = await initializeUserTrackConsumer();
  const { userBookingconsumer, userBookingproducer } = await initializeUserBookingProducerConsumer();
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await shutdownProducerConsumer(consumer, producer);
    await shutdownUserTrackConsumer(userTrackconsumer, userTrackproducer);
    await shutdownUserBookingProducerConsumer(userBookingconsumer, userBookingproducer);
    process.exit(0);
  });
};

// Start the consumer
startConsumer().catch(error => {
  console.error('Failed to start consumer:', error);
  process.exit(1);
});

// Routes
app.use('/api/v1', venueRoutes);
app.use('/api/v1/user', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});