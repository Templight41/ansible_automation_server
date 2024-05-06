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
    let { address, id } = req.body;
    // Remove the subnet mask from the address if it exists
    if (address.includes('/')) {
        address = address.split('/')[0];
    }
    const selectQuery = `SELECT * FROM inventory.inventory WHERE id = ?`;
    const insertQuery = `INSERT INTO inventory.inventory (id, address) VALUES (?, ?)`;
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
                db.query(insertQuery, [id, address], (err, result) => {
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
