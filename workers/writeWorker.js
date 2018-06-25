const writer = require('../pools/writer');
const delay = require('../utils/delay');
const logger = require('../utils/log');

const log = (str) => logger.info('WriteWorker.pid-' + process.pid + ': ' + str);

let COUNT = 0;
let FAIL_COUNT = 0;
const TASK_LIMIT = +Infinity;

const MODELS = {
    Artist: 'Artist',
    Album: 'Album',
    Category: 'Category',
    Song: 'Song'
}

process.on('uncaughtException', function(error) {
    log(error);
    process.send({ act: 'suicide' });
    process.exit(1);
});

process.on('exit', function() {
    log('writer finish tasks count: ' + COUNT + '. Failure tasks count: ' + FAIL_COUNT);
});

async function begin() {
    log('begin');
    const time = +new Date();
    try {
        const list = Object.keys(MODELS).map(async (modelType, index) => {
            await runner(modelType, index);
        });
        await Promise.all(list);
    } catch (err) {
        log(err)
    }
    log('finish tasks count: ' + COUNT + '. Failure tasks count: ' + FAIL_COUNT);
    log(`over: cost ` + (Date.now() - time) + 'ms');
}

async function runner(modelType, id) {
    let loop = true;
    log(`task start ${modelType}`);
    const time = +new Date();
    while (loop) {
        const res = await writer(modelType, log);
        if (res == 'failure') {
            FAIL_COUNT += 1;
        } else if (res == 'end') {
            log('finish tasks count: ' + COUNT + '. Failure tasks count: ' + FAIL_COUNT);
            await delay(5000);
        } else {
            COUNT += 1;
        }
        loop = COUNT < TASK_LIMIT;
    }
    log(`task end ${modelType}: cost ` + (Date.now() - time) + `ms. [writer-${id}]`);
}

begin().then(() => process.exit(0));
