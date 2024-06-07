const express = require('express');
require("dotenv").config();
const axios = require('axios');
const app = express();
const exec = require('child_process').exec;
const path = require('path');
const { spawn } = require('node-pty');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });


app.use(express.json());
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

const updateServer = require('./routes/updateServer');
const getAllServers = require('./routes/getAllServers');
const getServer = require('./routes/getServer');

const mongoose = require('mongoose');
const inventory = require('./schema/inventory');
const playbook = require('./schema/playbook');
const { v4: uuid } = require('uuid');

app.get('/', async (req, res) => {

    await mongoose.connect(process.env.DB_HOSTNAME + "/ansible")
    
    const playbookData = await playbook.find()
    console.log(playbookData)

    res.render("home", {playbookData})
})

app.post('/api/inventory', updateServer)

app.get('/api/inventory', getAllServers)

app.get('/api/inventory/:id', getServer)


wss.on('connection', ws => {
    ws.on('message', message => {
        console.log('Received message:', message.toString());
        // ws.send(message.toString())
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
                        ansible_become_pass: process.env.PASSWORD,
                        ansible_become_user: process.env.USERNAME
                    };
                }
            });

            const yaml = require('js-yaml');
            const fs = require('fs');

            const inventoryPath = './dynamic_inventory.yaml';
            const yamlContent = yaml.dump(inventoryContent);

            fs.writeFile(inventoryPath, yamlContent, async err => {
                if (err) {
                    console.error('Error writing inventory file:', err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                
                const playbookPath = './playbook.yml';
                // const extraVars = `--extra-vars "ansible_ssh_user=${process.env.USERNAME} ansible_ssh_pass=${process.env.PASSWORD}"`;
                
                await mongoose.connect(process.env.DB_HOSTNAME + "/ansible")
                const playbookData = await playbook.findOne({id: message.toString()})

                console.log(playbookData)

                require('fs').writeFile(playbookPath, playbookData.playbook, err => {
                    if (err) {
                        console.error('Error writing playbook file:', err);
                        ws.send(err);
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
                        ws.send(data);
                    });
                    
                    ptyProcess.on('exit', (code, signal) => {
                        if (code !== 0) {
                            console.error(`Ansible playbook process exited with code ${code}`);
                            ws.send(`Ansible playbook process exited with code ${code}`);
                            return;
                        }
                        console.log('Ansible playbook executed successfully');
                        ws.send('Ansible playbook executed successfully');
                    });
                    
                    // ptyProcess.on('error', err => {
                    //     console.error('Error executing Ansible playbook:', err);
                    //     res.status(500).send(err.message);
                    // });
                })
            });
        })
        .catch((error) => {
            console.error('Error fetching inventory data:', error);
            ws.send('Internal Server Error');
        });
    });
})

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

            fs.writeFile(inventoryPath, yamlContent, async err => {
                if (err) {
                    console.error('Error writing inventory file:', err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                
                const playbookPath = './playbook.yml';
                // const extraVars = `--extra-vars "ansible_ssh_user=${process.env.USERNAME} ansible_ssh_pass=${process.env.PASSWORD}"`;
                
                await mongoose.connect(process.env.DB_HOSTNAME + "/ansible")
                const playbookData = await playbook.findOne({id: req.body.playbookId})

                console.log(playbookData)

                require('fs').writeFile(playbookPath, playbookData.playbook, err => {
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
                    
                    // ptyProcess.on('error', err => {
                    //     console.error('Error executing Ansible playbook:', err);
                    //     res.status(500).send(err.message);
                    // });
                })
            });
        })
        .catch((error) => {
            console.error('Error fetching inventory data:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post("/api/test", (req, res) => {
    console.log(req.body.playbookId)
})

app.post("/api/addPlaybook", async (req, res) => {
    await mongoose.connect(process.env.DB_HOSTNAME + "/ansible")
    const newPlaybook = {
        id: uuid(),
        name: req.body.name,
        playbook: req.body.playbook
    }
    const response = await playbook.insertMany(newPlaybook)

    console.log(response)
    // await newPlaybook.save()
    res.json(response)
})

app.post("/api/deletePlaybook", async (req, res) => {
    await mongoose.connect(process.env.DB_HOSTNAME + "/ansible")
    const response = await playbook.deleteOne({id: req.body.id})
    console.log(response)
    res.json(response)
})

app.get("/playbook", async (req, res) => {

    await mongoose.connect(process.env.DB_HOSTNAME + "/ansible")
    
    const playbookData = await playbook.find()
    console.log(playbookData)

    res.render("playbook", {playData: playbookData})
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})
