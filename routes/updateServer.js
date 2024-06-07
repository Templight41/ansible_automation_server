const mongoose = require("mongoose");
const inventory = require("../schema/inventory");

module.exports = async (req, res) => {
    await mongoose.connect(process.env.DB_HOSTNAME + "/ansible")

    console.log({...req.body})

    const inventoryData = await inventory.findOne({id: req.body.id});
    console.log(inventoryData)

    req.body.address = req.body.address.replace(/^\s+|\s+$/gm,'');

    // console.log(result+"result")

    if (inventoryData == null) {
        await inventory.insertMany({id: req.body.id, address: req.body.address.trim(), lab: req.body.lab});

        res.status(200).send("Server added successfully");
        return;
    }

    const response = await inventory.updateOne(
        {id: req.body.id},
        {
            $set: {
                id: req.body.id,
                address: req.body.address.trim(),
                lab: req.body.lab
            }
        }
    );
    res.status(200).send("Server updated successfully");



};
