const { default: mongoose } = require('mongoose');
const inventory = require('../schema/inventory');


module.exports = async (req, res) => {
    
    await mongoose.connect(process.env.DB_HOSTNAME + "/ansible")
    
    const inventoryData = await inventory.find()
    console.log(inventoryData)

    res.status(200).json(inventoryData)
    
    mongoose.connection.close()

};
