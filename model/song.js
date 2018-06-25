const mongoose = require('mongoose');

const Song = new mongoose.Schema({
    id: Number,
    name: String,
    commentsCount: Number,
    artists: [
        {
            id: Number,
            name: String
        }
    ],
    duration: {
        type: Number,
        default: 0
    },
    albumId: Number,
    publishTime: Number,
    copyrightId: Number
});

module.exports = mongoose.model('Song', Song);