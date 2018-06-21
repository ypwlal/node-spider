const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const Song = new mongoose.Schema({
    id: ObjectId,
    commentsCount: Number,
    artistId: Number,
    artistName: String,
    albumId: Number,
    albumName: String
});

module.exports = mongoose.model('Song', Song);