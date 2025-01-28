
const createActivityTable = async (dbInstance) => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS activity (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        tagCount INTEGER,
        icon JSON,
        timeStamp JSON
    );
    `;

    try {
        dbInstance.query(queryText);
        console.log("Activity Table Created Successfully");
    } catch (err) {
        console.log(err);
    }
};

module.exports = createActivityTable;