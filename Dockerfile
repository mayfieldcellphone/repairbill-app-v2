FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (production & development for intermediate build phase)
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Start the server
EXPOSE 3000
# Cloud Run expects the app to listen on PORT environment variable, which defaults to 8080. 
# We'll set the environment variable and we should adapt server.cjs if needed, or simply let Cloud Run set it.
CMD ["npm", "start"]
