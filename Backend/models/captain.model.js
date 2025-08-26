

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const captainSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            minlength: [3, 'First name must be at least 3 characters long'],
        },
        lastname: {
            type: String,
            minlength: [3, 'Last name must be at least 3 characters long'],
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: [5, 'Email must be at least 5 characters long'],
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    vehicle: {
        color: {
            type: String,
            required: true,
        },
        plate: {
            type: String,
            required: true,
        },
        capacity: {
            type: Number,
            required: true,
        },
        vehicleType: {
            type: String,
            required: true,
            enum: ['car', 'motorcycle', 'auto'],
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    rating: {
        type: Number,
        default: 5,
        min: 1,
        max: 5
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    socketId: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Create a geospatial index on the location field
captainSchema.index({ location: '2dsphere' });

// Methods
captainSchema.methods.generateAuthToken = function () {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured in environment variables');
    }
    const token = jwt.sign({ _id: this._id }, jwtSecret, { expiresIn: '24h' });
    return token;
};

captainSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

captainSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
};

// Export the model
const Captain = mongoose.models.Captain || mongoose.model('Captain', captainSchema);
module.exports = Captain;


// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

// const captainSchema = new mongoose.Schema({
//     fullname: {
//         firstname: {
//             type: String,
//             required: [true, 'First name is required'],
//             minlength: [3, 'First name must be at least 3 characters long'],
//             trim: true
//         },
//         lastname: {
//             type: String,
//             minlength: [3, 'Last name must be at least 3 characters long'],
//             trim: true
//         }
//     },
//     email: {
//         type: String,
//         required: [true, 'Email is required'],
//         unique: true,
//         lowercase: true,
//         trim: true,
//         match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
//     },
//     password: {
//         type: String,
//         required: [true, 'Password is required'],
//         select: false,
//         minlength: [6, 'Password must be at least 6 characters long']
//     },
//     socketId: {
//         type: String,
//         default: null
//     },
//     status: {
//         type: String,
//         enum: ['active', 'inactive', 'on_ride'],
//         default: 'inactive'
//     },
//     vehicle: {
//         color: {
//             type: String,
//             required: [true, 'Vehicle color is required'],
//             minlength: [3, 'Color must be at least 3 characters long']
//         },
//         plate: {
//             type: String,
//             required: [true, 'License plate is required'],
//             minlength: [3, 'Plate must be at least 3 characters long'],
//             uppercase: true,
//             trim: true
//         },
//         capacity: {
//             type: Number,
//             required: [true, 'Vehicle capacity is required'],
//             min: [1, 'Capacity must be at least 1']
//         },
//         vehicleType: {
//             type: String,
//             required: [true, 'Vehicle type is required'],
//             enum: {
//                 values: ['car', 'motorcycle', 'auto'],
//                 message: 'Vehicle type must be either car, motorcycle, or auto'
//             }
//         }
//     },
//     location: {
//         type: {
//             type: String,
//             enum: ['Point'],
//             default: 'Point'
//         },
//         coordinates: {
//             type: [Number],
//             default: [0, 0],
//             validate: {
//                 validator: function(v) {
//                     return v.length === 2 && 
//                            v[0] >= -180 && v[0] <= 180 && 
//                            v[1] >= -90 && v[1] <= 90;
//                 },
//                 message: 'Invalid coordinates'
//             }
//         },
//         lastUpdated: {
//             type: Date,
//             default: Date.now
//         }
//     },
//     statistics: {
//         totalRides: {
//             type: Number,
//             default: 0,
//             min: 0
//         },
//         totalEarnings: {
//             type: Number,
//             default: 0,
//             min: 0
//         },
//         totalDistance: {
//             type: Number,
//             default: 0,
//             min: 0
//         },
//         rating: {
//             type: Number,
//             default: 0,
//             min: 0,
//             max: 5
//         },
//         totalRatings: {
//             type: Number,
//             default: 0,
//             min: 0
//         },
//         todayRides: {
//             type: Number,
//             default: 0,
//             min: 0
//         },
//         todayEarnings: {
//             type: Number,
//             default: 0,
//             min: 0
//         }
//     },
//     availability: {
//         isAvailable: {
//             type: Boolean,
//             default: false
//         },
//         lastOnlineAt: {
//             type: Date
//         },
//         workingHours: {
//             type: Number,
//             default: 0,
//             min: 0
//         }
//     },
//     documents: {
//         license: {
//             number: {
//                 type: String,
//                 trim: true
//             },
//             expiryDate: Date,
//             verified: {
//                 type: Boolean,
//                 default: false
//             }
//         },
//         insurance: {
//             number: {
//                 type: String,
//                 trim: true
//             },
//             expiryDate: Date,
//             verified: {
//                 type: Boolean,
//                 default: false
//             }
//         }
//     }
// }, {
//     timestamps: true,
//     toJSON: {
//         virtuals: true,
//         transform: function(doc, ret) {
//             delete ret.password;
//             delete ret.__v;
//             return ret;
//         }
//     },
//     toObject: {
//         virtuals: true
//     }
// });

// // Create geospatial index
// captainSchema.index({ location: '2dsphere' });

// // Add virtual for full name
// captainSchema.virtual('fullName').get(function() {
//     return `${this.fullname.firstname} ${this.fullname.lastname || ''}`.trim();
// });

// // Pre-save hook to hash password
// captainSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
    
//     try {
//         this.password = await bcrypt.hash(this.password, 10);
//         next();
//     } catch (err) {
//         next(err);
//     }
// });

// // Method to generate JWT token
// captainSchema.methods.generateAuthToken = function() {
//     if (!process.env.JWT_SECRET) {
//         throw new Error('JWT_SECRET is not configured');
//     }
//     return jwt.sign(
//         { _id: this._id, role: 'captain' },
//         process.env.JWT_SECRET,
//         { expiresIn: '24h' }
//     );
// };

// // Method to compare passwords
// captainSchema.methods.comparePassword = async function(candidatePassword) {
//     return await bcrypt.compare(candidatePassword, this.password);
// };

// // Static method to hash password
// captainSchema.statics.hashPassword = async function(password) {
//     return await bcrypt.hash(password, 10);
// };

// // Method to update statistics after a ride
// captainSchema.methods.updateStatistics = async function(ride) {
//     this.statistics.totalRides += 1;
//     this.statistics.totalEarnings += ride.fare;
//     this.statistics.totalDistance += ride.distance.value || 0;
    
//     // Update today's statistics if ride was today
//     const today = new Date().toDateString();
//     const rideDate = new Date(ride.createdAt).toDateString();
    
//     if (today === rideDate) {
//         this.statistics.todayRides += 1;
//         this.statistics.todayEarnings += ride.fare;
//     }
    
//     await this.save();
// };

// // Method to update rating
// captainSchema.methods.updateRating = async function(newRating) {
//     if (newRating < 1 || newRating > 5) {
//         throw new Error('Rating must be between 1 and 5');
//     }
    
//     const currentTotal = this.statistics.rating * this.statistics.totalRatings;
//     this.statistics.totalRatings += 1;
//     this.statistics.rating = (currentTotal + newRating) / this.statistics.totalRatings;
    
//     await this.save();
// };

// // Method to update location
// captainSchema.methods.updateLocation = async function(latitude, longitude) {
//     if (!latitude || !longitude) {
//         throw new Error('Both latitude and longitude are required');
//     }
    
//     this.location.coordinates = [longitude, latitude]; // GeoJSON uses [lng, lat]
//     this.location.lastUpdated = Date.now();
    
//     await this.save();
// };

// const Captain = mongoose.models.Captain || mongoose.model('Captain', captainSchema);
// module.exports = Captain;