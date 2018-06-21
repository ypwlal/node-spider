const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const Artist = new mongoose.Schema({
    category: Number,
    id: ObjectId,
    tag: String,
    name: String
});

module.exports = mongoose.model('Artist', Artist);