# Use the official Node.js 14 image as a base
FROM node:14

# Set the working directory in the container
WORKDIR /root

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

#Installing ansible
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    apt-get install -y ansible sshpass && \
    rm -rf /var/lib/apt/lists/*

# Expose the port your app runs on
EXPOSE 3000

# Command to run your application
CMD ["node", "app.js"]



# FROM python:3.8

# COPY ./inventory.yml .

# RUN apt-get update && \
#     apt-get install -y software-properties-common && \
#     apt-get install -y ansible sshpass && \
#     rm -rf /var/lib/apt/lists/*