# Use the official Python 3.8 image as a base
FROM python:3.8

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get update && apt-get install -y nodejs

# Set the working directory in the container
WORKDIR /root

# Copy package.json and package-lock.json to the working directory
COPY package.json ./
COPY package-lock.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your application code
COPY . ./

# Install Ansible
RUN pip3 install --upgrade pip && \
    pip3 install ansible && \
    apt-get install -y sshpass && \
    rm -rf /var/lib/apt/lists/*

# Expose the port your app runs on
EXPOSE 3000

# Command to run your application
CMD ["node", "index.js"]
