const mongoose = require('mongoose');

const playbookSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
    name: {
        type: String,
        required: true,
    },
  playbook: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Playbook', playbookSchema);
