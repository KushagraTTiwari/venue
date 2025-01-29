// consumers/userTrackConsumer.js
const { kafka } = require('../config/kafka');
const pool = require('../config/db');
const { getResponse, deleteResponse } = require('../utils/responseMap');

// Process user track message
const processUserTrackMessage = async (message, Id) => {
  const { userId, venueId, eventId, timestamp } = message;
  // console.log("datas are -> ", userId, venueId, eventId, timestamp )
  // const timestamp = new Date().toISOString()
  const key = Id ? Id.toString() : 'undefined';
  // console.log("request is -> ", key)
  var res = getResponse(key).res
  // if (!res) {
  //   console.error('Response object is undefined');
  //   return;
  // } else {
  //   console.log("getting res : ", res)
  // }
  try {
    const user = await pool.connect();
    const userResult = await user.query('SELECT clicks FROM user_clicks WHERE user_id = $1', [userId]);
    if(userResult.rows.length > 0) {
      let clicks = userResult.rows[0].clicks;

      // Find if the venue already exists in the user's clicks
      const venueIndex = clicks.findIndex((v) => v.venueId === venueId);

      if (venueIndex !== -1) {
        // Venue exists, add the event
        if (eventId) {
          clicks[venueIndex].events.push({
            eventId,
            timestamp,
            isBooked: false,
          });
        }
        clicks[venueIndex].timestamp = timestamp; // Update venue timestamp
      } else {
        // Venue does not exist, add it with the event
        clicks.push({
          venueId,
          timestamp,
          events: eventId
            ? [
                {
                  eventId,
                  timestamp,
                  isBooked: false,
                },
              ]
            : [],
        });
      }
      await user.query('UPDATE user_clicks SET clicks = $1 WHERE user_id = $2', [JSON.stringify(clicks), userId])
    }else {
      // User does not exist, create a new record
      const clicks = [
        {
          venueId,
          timestamp,
          events: eventId
            ? [
                {
                  eventId,
                  timestamp,
                  isBooked: false,
                },
              ]
            : [],
        },
      ];

      await user.query('INSERT INTO user_clicks (user_id, clicks) VALUES ($1, $2)', [userId, JSON.stringify(clicks)]);
    }
    user.release();
  
    res.status(200).send({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send({ error: 'Failed to track click' });
  } finally {
    deleteResponse(Id)
  }
};

// Main consumer setup and message handler
const setupUserTrackConsumer = async (consumer, producer) => {
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
const initializeUserTrackConsumer = async () => {
  const consumer = kafka.consumer({ groupId: 'user-track-group' });
  const producer = kafka.producer();

  try {
    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topics: ['user-track-requests'] });
    await setupUserTrackConsumer(consumer, producer);

    console.info('User Track Consumer started successfully');
    return { consumer, producer };
  } catch (error) {
    console.error('Error starting user track consumer:', error);
    throw error;
  }
};

// Shutdown function
const shutdownUserTrackConsumer = async (consumer, producer) => {
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
  initializeUserTrackConsumer,
  shutdownUserTrackConsumer
};
