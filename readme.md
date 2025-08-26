# Uber-like Ride-Sharing Application

## Project Overview

This project is a full-stack ride-sharing application inspired by Uber, featuring real-time location tracking, ride management, and separate interfaces for riders and drivers (captains). The application enables users to book rides, track drivers in real-time, and complete the ride with ratings and reviews.

## Tech Stack

### Frontend
- **React.js** - For building the user interface with component-based architecture
- **Tailwind CSS** - For responsive and modern UI design
- **Socket.io Client** - For real-time communication between users and captains
- **React Router** - For client-side routing
- **Mapbox GL** - For interactive maps and real-time location tracking

### Backend
- **Node.js** - JavaScript runtime for server-side code
- **MongoDB** - NoSQL database for storing user, captain, and ride data
- **Mongoose** - ODM for MongoDB
- **Socket.io** - For real-time bidirectional communication

### APIs
- **Mapbox API** - For maps, geocoding, and directions
- **Geoapify API** - For location services and address autocomplete
- **SerpAPI** - For search functionality

## Features

### User Features
- **Authentication** - Secure signup and login system
- **Ride Booking** - Search for locations and book rides
- **Fare Estimation** - Get fare estimates before confirming rides
- **Real-time Tracking** - Track captain's location in real-time
- **Ride History** - View past rides and details
- **Rating System** - Rate captains after completing rides
- **Payment Management** - View fare details and payment status

### Captain Features
- **Authentication** - Dedicated signup and login for captains
- **Ride Acceptance** - View and accept pending ride requests
- **Navigation** - Get directions to pickup and destination locations
- **Arrival Updates** - Send estimated arrival times to users
- **Ride Management** - Start, complete, and track rides
- **Earnings Dashboard** - View ride history and earnings

### Location Tracking
- Geolocation API for user/captain location tracking
- Mapbox for rendering maps and driving directions
- Real-time location updates via sockets

### Ride Lifecycle
1. User requests a ride with pickup and destination
2. Nearby captains receive ride requests
3. Captain accepts the ride and navigates to pickup location
4. Captain starts the ride after picking up the user
5. Captain completes the ride at the destination
