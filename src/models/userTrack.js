const createUserTrackTable = async (dbInstance) => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS user_clicks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    clicks JSONB DEFAULT '[]'
);
`

try {
    dbInstance.query(queryText)
    console.log("User Track Table Created Successfully")
} catch (error) {
    console.log("Getting error while creating usertrack table : ", error)
}
}


module.exports = createUserTrackTable;

// CREATE TABLE user_clicks (
//     id SERIAL PRIMARY KEY,
//     user_id UUID NOT NULL UNIQUE, -- Each user has a unique entry
//     clicks JSONB DEFAULT '[]' -- Stores the venue and event data as an array
// );
