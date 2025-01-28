const responseMap = new Map();

// Save the client response (res) and set a timeout
const setResponseWithTimeout = (requestId, res, timeout = 30000) => {
  responseMap.set(requestId, res);

  setTimeout(() => {
    if (responseMap.has(requestId)) {
      console.warn(`Request ${requestId} timed out.`);
      const res = responseMap.get(requestId);
      res.status(504).json({ success: false, message: 'Request timed out' });
      responseMap.delete(requestId);
    }
  }, timeout); // Default timeout is 30 seconds
};

// Retrieve the response object using the requestId
const getResponse = (requestId) => responseMap.get(requestId);

// Delete the response object from the map
const deleteResponse = (requestId) => responseMap.delete(requestId);

module.exports = {
  setResponseWithTimeout,
  getResponse,
  deleteResponse
};