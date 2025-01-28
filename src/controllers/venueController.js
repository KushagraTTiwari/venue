const {kafka} = require('../config/kafka');
const { v4: uuidv4 } = require('uuid');
const {setResponseWithTimeout} = require('../utils/responseMap');

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