const express = require('express');
require("dotenv").config();
const axios = require('axios');
const app = express();
const exec = require('child_process').exec;
const path = require('path');
const { spawn } = require('node-pty');


app.use(express.json());
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

const updateServer = require('./routes/updateServer');
const getAllServers = require('./routes/getAllServers');
const getServer = require('./routes/getServer');

app.get('/', (req, res) => {
    res.render("home")
})

app.post('/api/inventory', updateServer)

app.get('/api/inventory', getAllServers)

app.get('/api/inventory/:id', getServer)

app.post("/api/ansible/", (req, res) => {
    axios.get("http://localhost:3000/api/inventory")
        .then((response) => {
            const inventoryData = response.data;
            const inventoryContent = {
                all: {
                    hosts: {}
                }
            };

            inventoryData.forEach(item => {
                // Ensure the host address exists and is unique
                if (item.address && !inventoryContent.all.hosts[item.address]) {
                    inventoryContent.all.hosts[item.address] = {
                        ansible_user: process.env.USERNAME,
                        ansible_ssh_pass: process.env.PASSWORD,
                        ansible_become: true,
                        ansible_become_pass: process.env.PASSWORD
                    };
                }
            });

            const yaml = require('js-yaml');
            const fs = require('fs');

            const inventoryPath = './dynamic_inventory.yaml';
            const yamlContent = yaml.dump(inventoryContent);

            fs.writeFile(inventoryPath, yamlContent, err => {
                if (err) {
                    console.error('Error writing inventory file:', err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                
                const playbookPath = './playbook.yml';
                // const extraVars = `--extra-vars "ansible_ssh_user=${process.env.USERNAME} ansible_ssh_pass=${process.env.PASSWORD}"`;
                
                require('fs').writeFile(playbookPath, req.body.playbook, err => {
                    if (err) {
                        console.error('Error writing playbook file:', err);
                        res.status(500).send(err);
                        return;
                    }
                    
                    console.log("executing ansible playbook")
                    // console.log(extraVars)
                    // res.send('Ansible playbook executed successfully')
                    const command = `ansible-playbook -i ${inventoryPath} ${playbookPath} -e 'ansible_ssh_common_args="-o StrictHostKeyChecking=no"'`;

                    const ptyProcess = spawn('bash', ['-c', command], {
                        name: 'xterm-color',
                        cols: 80,
                        rows: 30,
                        cwd: process.cwd(),
                        env: process.env
                    });
                    
                    ptyProcess.on('data', data => {
                        console.log(data);
                    });
                    
                    ptyProcess.on('exit', (code, signal) => {
                        if (code !== 0) {
                            console.error(`Ansible playbook process exited with code ${code}`);
                            res.status(500).send(`Ansible playbook process exited with code ${code}`);
                            return;
                        }
                        console.log('Ansible playbook executed successfully');
                        res.send('Ansible playbook executed successfully');
                    });
                    
                    ptyProcess.on('error', err => {
                        console.error('Error executing Ansible playbook:', err);
                        res.status(500).send(err.message);
                    });
                })
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
