const pool = require('../config/db');

exports.createReview = async (req, res) => {
    const { 
        ID, 
        venueID, 
        name, 
        rating, 
        category, 
        description, 
        media, 
        likes, 
        dislikes, 
        report, 
        tags, 
        timeStamp 
    } = req.body;

    // Query to insert data
    const queryText = `
        INSERT INTO review (ID, venueID, name, rating, category, description, media, likes, dislikes, report, tags, timeStamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
    `;

    try {
        // Execute query with provided data
        const result = await pool.query(queryText, [
            ID,
            venueID,
            name,
            rating,
            category,
            description,
            media,
            likes,
            dislikes,
            report,
            tags,
            timeStamp
        ]);

        // Respond with success and inserted review
        return res.status(201).json({
            success: true,
            message: 'Review inserted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error inserting review:', error);
        return res.status(500).json({
            success: false,
            message: 'Error occurred while inserting review',
            error: error.message
        });
    }
};