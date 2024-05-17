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
    const getAllDataQuery = `SELECT * FROM inventory.inventory`;
    
    db.query(getAllDataQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send('Error fetching data');
        } else {
            console.log('Data fetched:', results);
            res.status(200).json(results);
        }
    });
};

// Close the connection when the app is terminated
process.on('SIGINT', () => {
    db.end((err) => {
        if (err) {
            console.error('Error closing database connection:', err);
        } else {
            console.log('Database connection closed');
            process.exit();
        }
    });
});
