# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application files
COPY . .

# Create directory for Ollama if needed (for local mode)
RUN mkdir -p /tmp/ollama

# Expose port for the chatbot
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/' }; const req = http.get(options, (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }); req.on('error', () => process.exit(1));"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV OLLAMA_URL=http://localhost:11434
ENV OLLAMA_MODEL=llama2

# Start the application
CMD ["node", "server.js"]
