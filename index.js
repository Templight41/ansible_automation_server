const express = require('express');
require("dotenv").config();
const axios = require('axios');
const app = express();
const exec = require('child_process').exec;

app.use(express.json());

const updateServer = require('./routes/updateServer');
const getAllServers = require('./routes/getAllServers');
const getServer = require('./routes/getServer');

app.post('/api/inventory', updateServer)

app.get('/api/inventory', getAllServers)

app.get('/api/inventory/:id', getServer)

app.get("/api/ansible/", (req, res) => {
    axios.get("http://localhost:3000/api/inventory")
        .then((response) => {
            const inventoryData = response.data;
            const addresses = inventoryData.map(item => item.address).filter(Boolean);
            const inventoryContent = `[all]\n${addresses.join('\n')}`;
            
            const inventoryPath = './dynamic_inventory';
            require('fs').writeFile(inventoryPath, inventoryContent, err => {
                if (err) {
                    console.error('Error writing inventory file:', err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                
                const playbookPath = './playbook.yml';
                const extraVars = `--extra-vars "ansible_ssh_user=${process.env.USERNAME} ansible_ssh_pass=${process.env.PASSWORD}"`;
                console.log("executing ansible playbook")
                // console.log(extraVars)
                // res.send('Ansible playbook executed successfully')
                exec(`ansible-playbook -i ${inventoryPath} ${extraVars} ${playbookPath}`, (err, stdout, stderr) => {
                    if (err) {
                        console.error('Error executing Ansible playbook:', err);
                        res.status(500).send('Internal Server Error');
                        return;
                    }
                    console.log('Ansible playbook executed successfully:', stdout);
                    res.send('Ansible playbook executed successfully');
                });
            });
        })
        .catch((error) => {
            console.error('Error fetching inventory data:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})
