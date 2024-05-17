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

const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS inventory`;
const createTableQuery = `CREATE TABLE IF NOT EXISTS inventory.inventory (id VARCHAR(255) PRIMARY KEY, address VARCHAR(255))`;

db.query(createDatabaseQuery, (err) => {
    if (err) {
        console.error('Error creating database:', err);
    } else {
        console.log('Database created');
    }
});

db.query(createTableQuery, (err) => {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('Table created');
    }
});

module.exports = (req, res) => {
    let { address, id, lab } = req.body;
    // Remove the subnet mask from the address if it exists
    if (address.includes('/')) {
        address = address.split('/')[0];
    }
    const selectQuery = `SELECT * FROM inventory.inventory WHERE id = ?`;
    const insertQuery = `INSERT INTO inventory.inventory (id, address, lab) VALUES (?, ?, ?)`;
    const updateQuery = `UPDATE inventory.inventory SET address = ? WHERE id = ?`;
    
    // Check if the record with the given ID exists
    db.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('Error checking existing data:', err);
            res.status(500).send('Error checking existing data');
        } else {
            if (results.length > 0) {
                // If record exists, update the address
                db.query(updateQuery, [address, id], (err, result) => {
                    if (err) {
                        console.error('Error updating data:', err);
                        res.status(500).send('Error updating data');
                    } else {
                        console.log('Data updated');
                        res.status(200).send('Data updated');
                    }
                });
            } else {
                // If record doesn't exist, insert a new record
                db.query(insertQuery, [id, address, lab], (err, result) => {
                    if (err) {
                        console.error('Error inserting data:', err);
                        res.status(500).send('Error inserting data');
                    } else {
                        console.log('Data inserted');
                        res.status(200).send('Data inserted');
                    }
                });
            }
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
