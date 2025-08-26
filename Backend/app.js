const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers.authorization ? 
        `Authorization: ${req.headers.authorization.substring(0, 15)}...` : 
        'No authorization header');
    next();
});

// Socket.IO will be injected by server.js
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/users', require('./routes/user.routes'));
app.use('/captains', require('./routes/captain.routes'));
app.use('/rides', require('./routes/ride.routes'));
app.use('/maps', require('./routes/maps.routes'));
app.use('/geoapify', require('./routes/geoapify.routes'));
app.use('/serpapi', require('./routes/serpapi.routes'));

module.exports = app;