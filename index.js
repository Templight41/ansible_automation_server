const express = require('express');
require("dotenv").config();
const app = express();

app.use(express.json());

const updateServer = require('./routes/updateServer');
const getAllServers = require('./routes/getAllServers');
const getServer = require('./routes/getServer');

app.post('/api/inventory', updateServer)

app.get('/api/inventory', getAllServers)

app.get('/api/inventory/:id', getServer)

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})
