const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
});

const valueTextSchema = new mongoose.Schema({
    value: { type: Number, required: true },
    text: { type: String, required: true }
});

const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Captain'
    },
    pickup: {
        address: String,
        latitude: Number,
        longitude: Number
    },
    destination: {
        address: String,
        latitude: Number,
        longitude: Number
    },
    fare: Number,
    distance: {
        text: String,
        value: Number
    },
    duration: {
        text: String,
        value: Number
    },
   status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'started', 'waiting_for_rating', 'completed', 'cancelled'],
    default: 'pending'
},
    vehicleType: {
        type: String,
        required: true,
        enum: ['car', 'bike', 'auto']
    },
    otp: {
        type: String,
        required: true
    },
     arrivalTime: {
        minutes: Number,
        updatedAt: Date
    },
    rating: {
        user: {
            rating: { type: Number, min: 1, max: 5 },
            comment: String
        },
        captain: {
            rating: { type: Number, min: 1, max: 5 },
            comment: String
        }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    earnings: {
        amount: Number,
        platform_fee: Number,
        captain_earning: Number
    },
    startTime: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String
}, { timestamps: true });
rideSchema.post('save', async function(doc) {
    if (doc.status === 'completed' && doc.captain) {
        const captain = await mongoose.model('Captain').findById(doc.captain);
        if (captain) {
            // Update earnings
            captain.totalEarnings = (captain.totalEarnings || 0) + doc.earnings.captain_earning;
            
            // Update rating
            if (doc.rating?.user?.rating) {
                const ratings = await mongoose.model('Ride')
                    .find({ captain: captain._id, status: 'completed', 'rating.user.rating': { $exists: true } })
                    .select('rating.user.rating');
                    
                const totalRating = ratings.reduce((sum, r) => sum + r.rating.user.rating, 0);
                captain.rating = totalRating / ratings.length;
            }
            
            await captain.save();
        }
    }
});

module.exports = mongoose.model('Ride', rideSchema);