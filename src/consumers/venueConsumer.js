const {kafka} = require('../config/kafka');
const pool = require('../config/db');
const { getResponse, deleteResponse } = require('../utils/responseMap');


// Query builders for different message types
const queryBuilders = {
  GET_ALL_VENUES: () => ({
    text: 'SELECT * FROM venue',
    values: []
  }),

  GET_ALL_ACTIVITIES: () => ({
    text: 'SELECT * FROM activity',
    values: []
  }),

  GET_VENUES_BY_LOCATION: ({ latitude, longitude }) => ({
    text: `
      SELECT *,
      (
        6371000 * acos(
          cos(radians($2)) * cos(radians((location->>'latitude')::float)) *
          cos(radians((location->>'longitude')::float) - radians($1)) +
          sin(radians($2)) * sin(radians((location->>'latitude')::float))
        )
      ) AS distance
      FROM venue
      WHERE (
        6371000 * acos(
          cos(radians($2)) * cos(radians((location->>'latitude')::float)) *
          cos(radians((location->>'longitude')::float) - radians($1)) +
          sin(radians($2)) * sin(radians((location->>'latitude')::float))
        )
      ) <= 5000
      ORDER BY distance ASC
    `,
    values: [longitude, latitude]
  }),

  GET_VENUES_BY_ACTIVITY: ({ activityLinks }) => ({
    text: `
      SELECT * 
      FROM venue
      WHERE (
          SELECT array_agg(activity->>'id')
          FROM jsonb_array_elements(activitylinks::jsonb) as activity
      ) @> $1
    `,
    values: [activityLinks.split(',')]
  }),

  GET_VENUES_PAGINATED: ({ page, size }) => ({
    text: 'SELECT * FROM venue LIMIT $1 OFFSET $2',
    values: [size, (page - 1) * size]
  }),

  GET_ACTIVITIES_PAGINATED: ({ page, size }) => ({
    text: 'SELECT * FROM activity LIMIT $1 OFFSET $2',
    values: [size, (page - 1) * size]
  }),

  GET_VENUES_BY_LOCATION_AND_ACTIVITY: ({ latitude, longitude, activityLinks }) => ({
    text: `
      SELECT *,
    (
        6371000 * acos(
            cos(radians($2)) * cos(radians((location->>'latitude')::float)) *
            cos(radians((location->>'longitude')::float) - radians($1)) +
            sin(radians($2)) * sin(radians((location->>'latitude')::float))
        )
    ) AS distance
    FROM venue
    WHERE 
    (
        6371000 * acos(
            cos(radians($2)) * cos(radians((location->>'latitude')::float)) *
            cos(radians((location->>'longitude')::float) - radians($1)) +
            sin(radians($2)) * sin(radians((location->>'latitude')::float))
        )
    ) <= 5000
    AND (
        SELECT array_agg(activity->>'id')
        FROM jsonb_array_elements(activitylinks::jsonb) as activity
    ) @> $3
    ORDER BY distance ASC
    `,
    values: [longitude, latitude, JSON.stringify(activityLinks.split(','))]
  })
};

// Process incoming messages
const processMessage = async (type, payload) => {
  const queryBuilder = queryBuilders[type];
  // console.log("This is querybuilder ",queryBuilder);
  if (!queryBuilder) {
    throw new Error(`Unknown message type: ${type}`);
  }

  const query = queryBuilder(payload);
  // console.log("This is query ",query);
  const result = await pool.query(query.text, query.values);
  return result;
};

// Send response back through Kafka
const sendResponse = async (producer, response, key) => {

  const { success, data, requestId, metadata} = response;


  const res = getResponse(requestId); // Get the HTTP response object from the map
  if (res) {
    if (success) {
      res.status(200).json({ success, data,metadata }); // Send the data back to the client
    } else {
      res.status(500).json({ success, message: 'Error fetching data' });
    }
    deleteResponse(requestId); // Remove the response from the map
  }
};

// Handle errors
const handleError = async (producer, error, originalMessage) => {
  const errorResponse = {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR'
    },
    requestId: JSON.parse(originalMessage.value.toString()).payload.requestId
  };

  await sendResponse(producer, errorResponse, originalMessage.key);
};

// Main consumer setup and message handler
const setupConsumer = async (consumer, producer) => {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const request = JSON.parse(message.value.toString());
        const { type, payload } = request;
        // console.log("This is request from Producer:",request);
        console.info(`Processing message type: ${type}`);
        const result = await processMessage(type, payload);
        
        await sendResponse(producer, {
          success: true,
          data: result.rows,
          requestId: payload.requestId,
          metadata: {
            currentPage: payload.page,
            rowPerPage: payload.size,
            totalRows: result.rowCount
          }
        }, message.key);
      } catch (error) {
        console.error('Error processing message:', error);
        await handleError(producer, error, message);
      }
    }
  });
};

// Initialize and start the consumer
const initializeProducerConsumer = async () => {
  const consumer = kafka.consumer({ groupId: 'venue-group' });
  const producer = kafka.producer();

  try {
    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topics: ['venue-requests'] });
    await setupConsumer(consumer, producer);
    
    console.info('Venue Consumer & Producer started successfully');
    
    return { consumer, producer };
  } catch (error) {
    console.error('Error starting venue consumer:', error);
    throw error;
  }
};

// Shutdown function
const shutdownProducerConsumer = async (consumer, producer) => {
  try {
    await consumer.disconnect();
    await producer.disconnect();
    console.info('Venue consumer shutdown successfully');
  } catch (error) {
    console.error('Error during consumer shutdown:', error);
    throw error;
  }
};

module.exports = {
  initializeProducerConsumer,
  shutdownProducerConsumer
};