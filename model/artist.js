const mongoose = require('mongoose');

const Artist = new mongoose.Schema({
    catId: Number,
    id: Number,
    name: String
});

module.exports = mongoose.model('Artist', Artist);