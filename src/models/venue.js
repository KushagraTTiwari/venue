
const createVenueTable = async (dbInstance) => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS venue (
    ID VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    address1 VARCHAR(255),
    address2 VARCHAR(255),
    contactNo BIGINT,
    mapLink TEXT,
    location JSON,
    activityLinks JSON,
    image JSON,
    googleRatings DOUBLE PRECISION,
    reviews JSON,
    description VARCHAR(255),
    nearByVenues JSON,
    locationTimings JSON,
    timestamp JSON
    );
    `;

    try {
        dbInstance.query(queryText);
        console.log("Venue Table Created Successfully");
    } catch (err) {
        console.log(err);
    }
};

module.exports = createVenueTable;