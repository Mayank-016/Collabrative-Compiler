# Use an official Node.js image as the base
FROM node:14.17.0

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the project files to the working directory
COPY . .

# Build the React app
RUN npm run build

# Expose the port your application runs on (assuming it's 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
