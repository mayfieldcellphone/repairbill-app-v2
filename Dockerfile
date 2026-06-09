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
CMD ["npm", "start"]
