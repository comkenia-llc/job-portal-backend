// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require("path");
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// Import routes
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const companyRoutes = require('./routes/companyRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/locations', locationRoutes);

// Default route
app.get('/', (req, res) => {
    res.json({ message: '🚀 Job Portal API running' });
});

// Global error handler (example)
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
