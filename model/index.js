const mongoose = require('mongoose');
mongoose.connect('mongodb://192.168.31.112:21708/foo');
mongoose.Promise = Promise;

mongoose.plugin(schema => {
    schema.add({ createAt: { type: Date, default: Date.now } });
    schema.add({ updateAt: { type: Date, default: Date.now } });

    const updateHandler = function (next) {
        this._update.updateAt = new Date();
        next();
    }
    schema.pre('update', updateHandler);
    schema.pre('updateOne', updateHandler);
    schema.pre('findOneAndUpdate', updateHandler);
    schema.pre('updateMany', updateHandler);
});

module.exports = {
    Artist: require('./artist'),
    Album: require('./album'),
    Song: require('./song')
};
