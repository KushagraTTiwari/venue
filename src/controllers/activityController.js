const pool = require('../config/db');

exports.createActivity = async (req, res) => {
    const { id, name, tagCount, icon, timeStamp } = req.body;

    // Query to insert data
    const queryText = `
        INSERT INTO activity (id, name, tagCount, icon, timeStamp)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    try {
        // Execute query with provided data
        const result = await pool.query(queryText, [
            id,
            name,
            tagCount,
            icon,
            timeStamp
        ]);

        // Respond with success and inserted activity
        return res.status(201).json({
            success: true,
            message: 'Activity inserted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error inserting activity:', error);
        return res.status(500).json({
            success: false,
            message: 'Error occurred while inserting activity',
            error: error.message
        });
    }
};