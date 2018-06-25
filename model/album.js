const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const Album = new mongoose.Schema({
    id: Number,
    name: String,
    company: String,
    publishTime: String,
    commentsCount: Number,
    artists: [
        {
            id: Number,
            name: String
        }
    ],
    picUrl: String
});

module.exports = mongoose.model('Album', Album);
