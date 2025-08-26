const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectToDb = require('./db/db');
const { setupSocketEvents } = require('./socket');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Set defaults if environment variables are missing
if (!process.env.DB_CONNECT) {
    process.env.DB_CONNECT = 'mongodb://localhost:27017/uber-video';
}
if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET not set. Using default value (unsafe for production)');
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
}

// Connect to database
connectToDb();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with enhanced CORS settings
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
});

// Make io instance available throughout the app
app.set('io', io);

// Set up socket event handlers
setupSocketEvents(io);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO ready for connections`);
});