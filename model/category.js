const mongoose = require('mongoose');

const Category = new mongoose.Schema({
    id: Number,
    name: String
});

module.exports = mongoose.model('Category', Category);