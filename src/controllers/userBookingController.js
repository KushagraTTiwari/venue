// controllers/userController.js
const { kafka } = require('../config/kafka');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const {setResponseWithTimeout} = require("../utils/responseMap")

const producer = kafka.producer();

exports.userBooking = async (req, res) => {
    const { userId, venueId, eventId, paid_price, transaction_Id } = req.body;
    console.log("from controller")

  if (!userId || !venueId || !eventId || !paid_price || !transaction_Id) {
    return res.status(400).json({ success: false, message: 'Plese fill the all required field' });
  }


  const requestId = uuidv4();
  const timestamp = new Date().toISOString();

  try {
    await producer.connect();

    const payload = {
      userId,
      venueId,
      eventId,
      paid_price,
      transaction_Id,
      timestamp
    };
    console.log("the payload is : -> ", payload)

    setResponseWithTimeout(requestId, res);

    // Send message to Kafka
    await producer.send({
      topic: 'user-booking-requests',
      messages: [{
        key: requestId,
        value: JSON.stringify(payload)
      }]
    });

    console.log("message send to consumer by producer")

    // res.status(200).json({ success: true, message: 'User click tracked successfully' });
  } catch (error) {
    console.error('Getting error while adding the booking detail :', error);
    res.status(500).json({ success: false, message: 'Getting error while adding the booking detail, check the all details' });
  } finally {
    await producer.disconnect();
  }
};


exports.getBookingsByUser = async (req, res) => {
    const { userId } = req.params;
    console.log("userid : ->", userId)
    console.log("params : ->", req.params)
  
    try {
      // Validate userid
      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }
  
      // Fetch bookings by userid
      const query = `
        SELECT userid, venueid, eventid, paid_price, transaction_id, timestamp
        FROM bookings
        WHERE userid = $1
        ORDER BY timestamp DESC;
      `;
      const result = await pool.query(query, [userId]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No bookings found for the user' });
      }
  
      res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };