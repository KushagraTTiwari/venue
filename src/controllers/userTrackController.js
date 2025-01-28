// controllers/userController.js
const { kafka } = require('../config/kafka');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const {setResponseWithTimeout} = require("../utils/responseMap")

const producer = kafka.producer();

exports.trackUserClick = async (req, res) => {
  const { userId, venueId, eventId } = req.body;

  if (!userId || !venueId) {
    return res.status(400).json({ success: false, message: 'userId and venueId are required' });
  }

  const requestId = uuidv4();
  const timestamp = new Date().toISOString();

  try {
    await producer.connect();

    const payload = {
      userId,
      venueId,
      eventId,
      timestamp
    };

    setResponseWithTimeout(requestId, res);
    

    // Send message to Kafka
    await producer.send({
      topic: 'user-track-requests',
      messages: [{
        key: requestId,
        value: JSON.stringify(payload)
      }]
    });

    // res.status(200).json({ success: true, message: 'User click tracked successfully' });
  } catch (error) {
    console.error('Error tracking user click:', error);
    res.status(500).json({ success: false, message: 'Error tracking user click' });
  } finally {
    await producer.disconnect();
  }
};


exports.getUserTrackingData = async (req, res) => {
  const { userId } = req.params;

  try {
    const query = {
      text: `
        SELECT * 
        FROM user_clicks
        WHERE user_id = $1
      `,
      values: [userId],
    };

    const result = await pool.query(query.text, query.values);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching user tracking data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user tracking data",
    });
  }
};