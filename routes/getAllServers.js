const mysql = require('mysql2');
require('dotenv').config();

const dbURL = `mysql://root:${process.env.DB_PASS}@localhost:3306`;
const db = mysql.createConnection(dbURL);

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to database');
    }
});

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
