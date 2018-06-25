const log4js = require('log4js');
const path = require('path');

log4js.configure({
    appenders: {
        out: { type: 'stdout' },
        info: { type: 'file', filename: path.join(__dirname, '../info.log') }
    },
    categories: {
        default: { appenders: [ 'out', 'info' ], level: 'info' }
    }
});

const logger = log4js.getLogger('info');

module.exports = logger;
