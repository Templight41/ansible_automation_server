const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOSTNAME,
    user: 'root',
    password: process.env.DB_PASS,
    // database: 'mydatabase',
    port: 3306
};

let db;

function handleDisconnect() {
    db = mysql.createConnection(dbConfig);

    db.connect(err => {
        if (err) {
            console.error('Error connecting to database:', err);
            // Retry connection after 2 seconds if connection fails
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('Connected to database');
        }
    });

    db.on('error', err => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection lost, reconnecting...');
        } else {
            console.error('Database error:', err);
            // throw err;
        }
        setTimeout(handleDisconnect, 2000);
    });
}

handleDisconnect();

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
