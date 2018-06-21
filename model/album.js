const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const Album = new mongoose.Schema({
    id: ObjectId,
    company: String,
    releaseTime: String,
    commentsCount: Number,
    descr: String,
    artistId: Number,
    artistName: String
});

module.exports = mongoose.model('Album', Album);
