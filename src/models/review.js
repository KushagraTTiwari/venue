
const createReviewTable = async (dbInstance) => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS review (
    ID VARCHAR PRIMARY KEY,
    venueID VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    rating NUMERIC,
    category VARCHAR,
    description VARCHAR,
    media TEXT[],
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    report VARCHAR,
    tags VARCHAR,
    timeStamp JSONB
    );
    `;

    try {
        dbInstance.query(queryText);
        console.log("Review Table Created Successfully");
    } catch (err) {
        console.log(err);
    }
};

module.exports = createReviewTable;