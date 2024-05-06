const mysql = require('mysql2');
require('dotenv').config();

const dbURL = `mysql://root:${process.env.DB_PASS}@${process.env.DB_HOSTNAME}:3306`;
const db = mysql.createConnection(dbURL);

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to database');
    }
});

module.exports = (req, res) => {
    const id = req.params.id;
    const selectQuery = `SELECT * FROM inventory.inventory WHERE id = ?`;
    
    // Retrieve data based on the provided ID
    db.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send('Error fetching data');
        } else {
            if (results.length === 0) {
                // If no data found for the provided ID
                res.status(404).send('Data not found');
            } else {
                // If data found, send it as a response
                console.log('Data fetched:', results[0]);
                res.status(200).json(results[0]);
            }
        }
    });
};
