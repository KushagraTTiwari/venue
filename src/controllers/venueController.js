const {kafka} = require('../config/kafka');
const { v4: uuidv4 } = require('uuid');
const {setResponseWithTimeout} = require('../utils/responseMap');
const pool = require('../config/db');

const producer = kafka.producer();

exports.getVenue = async (req, res) => {
  const requestId = uuidv4();
  const { 
    isOnlyVenueDetails, 
    latitude, 
    longitude, 
    activityLinks, 
    page, 
    size 
  } = req.query;

  try {
    await producer.connect();
    
    let messageType;
    let payload = { requestId };
    console.log(payload);

    if (isOnlyVenueDetails === "true") {
      if (latitude && longitude) {
        messageType = 'GET_VENUES_BY_LOCATION';
        payload = { ...payload, latitude, longitude };
      } else if (activityLinks) {
        messageType = 'GET_VENUES_BY_ACTIVITY';
        payload = { ...payload, activityLinks };
      } else if (page && size) {
        messageType = 'GET_VENUES_PAGINATED';
        payload = { ...payload, page, size };
      } else {
        messageType = 'GET_ALL_VENUES';
      }
    } else {
      messageType = page && size ? 'GET_ACTIVITIES_PAGINATED' : 'GET_ALL_ACTIVITIES';
      payload = { ...payload, page, size };
    }

    // Save the response object in the response map with a timeout
    setResponseWithTimeout(requestId, res);

    await producer.send({
      topic: 'venue-requests',
      messages: [{
        key: requestId,
        value: JSON.stringify({
          type: messageType,
          payload
        })
      }]
    });

    console.log("Request accepted & Request ID: ",requestId);
   
  } catch (error) {
    console.error('Error producing message:', error);
    res.status(500).json({
      success: false,
      message: "Error processing request"
    });
  } finally {

    await producer.disconnect();
    console.log("Producer is Disconected");
  }
};


exports.createVenue = async(req,res) =>{

  // Extract data from the request body
  const {
    id,
    name,
    address1,
    address2,
    contactNo,
    mapLink,
    location,
    activityLinks,
    image,
    googleRatings,
    reviews,
    description,
    nearByVenues,
    locationTimings,
    timestamp,
  } = req.body;

  // SQL query to insert data
  const query = `
    INSERT INTO venue (
      ID,
      name,
      address1,
      address2,
      contactNo,
      mapLink,
      location,
      activityLinks,
      image,
      googleRatings,
      reviews,
      description,
      nearByVenues,
      locationTimings,
      timestamp
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    )
    RETURNING *;
  `;

  // Values to bind to the query
  const values = [
      id,
      name,
      address1,
      address2,
      contactNo,
      mapLink,
      JSON.stringify(location),
      JSON.stringify(activityLinks),
      JSON.stringify(image),
      googleRatings,
      JSON.stringify(reviews),
      description,
      JSON.stringify(nearByVenues),
      JSON.stringify(locationTimings),
      JSON.stringify(timestamp)
  ];

  try {
    // Execute the query
    const result = await pool.query(query, values);

    // Respond with the inserted data
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Row inserted Successufully in Venue Data'
    });
  } catch (error) {
    console.error('Error inserting data into venue table:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to insert data into venue table',
      error: error.message,
    });
  }
};
