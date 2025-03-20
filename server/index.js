const express = require('express');
const mongoose = require('mongoose');
const identifyRoute = require('./routes/identify');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Routes
app.use('/identify', identifyRoute);

app.use(errorHandler);


module.exports = app
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
