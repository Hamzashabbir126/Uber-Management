let io;

const setupSocketEvents = (socketIO) => {
    io = socketIO;
    
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        
        socket.on('join', (data) => {
            console.log(`${data.userType} ${data.userId} joined`);
            
            // Update user or captain model with socket ID
            if (data.userType === 'user') {
                require('./models/user.model').findByIdAndUpdate(data.userId, { socketId: socket.id }).exec();
            } else if (data.userType === 'captain') {
                require('./models/captain.model').findByIdAndUpdate(data.userId, { socketId: socket.id }).exec();
            }
        });
        socket.on('captain-arrival-time', (data) => {
    console.log('Captain arrival time update:', data);
    // Find user's socket ID from the database
    const User = require('./models/user.model');
    User.findById(data.userId).then(user => {
        if (user && user.socketId) {
            // Send arrival time update to the specific user
            io.to(user.socketId).emit('captain-arrival-update', {
                rideId: data.rideId,
                arrivalTime: data.arrivalTime
            });
        } else {
            console.log('User not found or no socketId available');
        }
    }).catch(err => {
        console.error('Error finding user for arrival time update:', err);
    });
});
        socket.on('update-location-captain', async (data) => {
            try {
                const { userId, location } = data;
                
                // Validate coordinates to prevent null values
                if (!location || typeof location.lng !== 'number' || typeof location.ltd !== 'number') {
                    console.error('Invalid location data received:', location);
                    socket.emit('location-update-error', {
                        message: 'Invalid location data. Both latitude and longitude must be numbers.'
                    });
                    return;
                }
                
                const Captain = require('./models/captain.model');
                
                await Captain.findByIdAndUpdate(userId, {
                    location: {
                        type: 'Point',
                        coordinates: [location.lng, location.ltd]
                    }
                });
                
                // Broadcast to all connected clients that a captain's location changed
                socket.broadcast.emit('captain-location-changed', {
                    captainId: userId,
                    location
                });
            } catch (error) {
                console.error('Error updating captain location:', error);
                socket.emit('location-update-error', {
                    message: 'Server error while updating location'
                });
            }
        });
        
        socket.on('captain-arrival-time', (data) => {
            // Find user's socket ID from the database
            require('./models/user.model').findById(data.userId).then(user => {
                if (user && user.socketId) {
                    // Send arrival time update to the specific user
                    io.to(user.socketId).emit('captain-arrival-update', {
                        rideId: data.rideId,
                        arrivalTime: data.arrivalTime
                    });
                }
            }).catch(err => {
                console.error('Error finding user for arrival time update:', err);
            });
        });
        
        socket.on('ride-started', (data) => {
            require('./models/ride.model').findById(data.rideId)
                .populate('user')
                .then(ride => {
                    if (ride && ride.user && ride.user.socketId) {
                        io.to(ride.user.socketId).emit('ride-started', {
                            ride: ride
                        });
                    }
                }).catch(err => {
                    console.error('Error finding ride for started notification:', err);
                });
        });
        
        socket.on('ride-completed', async (data) => {
            console.log('🚗 Ride completed event received on server:', data);
            
            if (!data || !data.rideId) {
                console.error('Invalid ride completed data - missing rideId:', data);
                return;
            }
            
            try {
                // Find the ride
                const Ride = require('./models/ride.model');
                const User = require('./models/user.model');
                
                const ride = await Ride.findById(data.rideId)
                  .populate('user')
                  .populate('captain');
                
                if (!ride) {
                  console.error('Ride not found for completion notification:', data.rideId);
                  return;
                }
                
                // Try multiple ways to notify the user
                
                // 1. Direct notification to user's socket if available
                if (ride.user && typeof ride.user === 'object' && ride.user.socketId) {
                  console.log(`[1] Notifying user ${ride.user._id} via direct socket ${ride.user.socketId}`);
                  io.to(ride.user.socketId).emit('ride-completed', {
                    ride: data.ride || ride
                  });
                }
                
                // 2. Broadcast to the ride room
                const rideRoom = `ride-${data.rideId}`;
                console.log(`[2] Broadcasting to ride room: ${rideRoom}`);
                io.to(rideRoom).emit('ride-completed', {
                  ride: data.ride || ride
                });
                
                // 3. Broadcast to all connected sockets (last resort)
                console.log(`[3] Broadcasting to all sockets`);
                io.emit('ride-completed', {
                  ride: data.ride || ride
                });
                
                console.log('All ride completion notifications sent');
                
            } catch (error) {
                console.error('Error processing ride completion notification:', error);
            }
        });
        
        socket.on('join-ride', (data) => {
            if (data && data.rideId) {
                console.log(`Socket ${socket.id} joining ride room: ride-${data.rideId}`);
                socket.join(`ride-${data.rideId}`);
            }
        });
        
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

const sendMessageToSocketId = (socketId, message) => {
  if (!io) {
    console.error('Socket.io instance not available');
    return false;
  }
  
  if (!socketId) {
    console.error('No socket ID provided');
    return false;
  }
  
  try {
    console.log(`Sending ${message.event} event to socket ${socketId}`);
    io.to(socketId).emit(message.event, message.data);
    return true;
  } catch (error) {
    console.error('Error sending socket message:', error);
    return false;
  }
};

module.exports = {
    setupSocketEvents,
    sendMessageToSocketId
};