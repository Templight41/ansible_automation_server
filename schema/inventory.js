const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  lab: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);
