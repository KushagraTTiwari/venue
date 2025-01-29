const responseMap = new Map();

// Save the client response (res) and set a timeout
const setResponseWithTimeout = (requestId, res, timeout = 30000) => {
  // Store the response and its timeout
  responseMap.set(requestId, { res, timeoutId: null });

  // Set the timeout to handle the scenario when the request takes too long
  const timeoutId = setTimeout(() => {
    if (responseMap.has(requestId)) {
      console.warn(`Request ${requestId} timed out.`);
      const { res } = responseMap.get(requestId);
      if (!res.headersSent) {
        res.status(504).json({ success: false, message: 'Request timed out' });
      }
      responseMap.delete(requestId);
    }
  }, timeout);

  // Update the timeoutId in the map
  responseMap.get(requestId).timeoutId = timeoutId;
};

// Retrieve the response object using the requestId
const getResponse = (requestId) => responseMap.get(requestId);

// Delete the response object from the map and clear the timeout
const deleteResponse = (requestId) => {
  if (responseMap.has(requestId)) {
    const { timeoutId } = responseMap.get(requestId);
    clearTimeout(timeoutId); // Clear the timeout if the request is resolved
    responseMap.delete(requestId);
  }
};

module.exports = {
  setResponseWithTimeout,
  getResponse,
  deleteResponse
};
