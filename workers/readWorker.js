const { tasks, TASK_MAP, HOST_NAME } = require('../task');;
const SpiderPool = require('../pools/spiderPool');
const redisSvc = require('../service/redis');
const delay = require('../utils/delay');

const logger = require('../utils/log'); 

const TASK_STEP_LIMIT = 1000;
let FAIL_COUNT = 0;
let SUCCESS_COUNT = 0;

const log = (str) => logger.info('ReadWorker.pid-' + process.pid + ': ' + str);

process.on('uncaughtException', function(error) {
    log(error);
    process.send({ act: 'suicide' });
    redisSvc.quit();
    process.exit(1);
});

process.on('exit', function() {
    log('finish tasks count: ' + SUCCESS_COUNT);
});

async function begin() {
    log('begin');
    const time = +new Date();
    const list = [];
    let hasUseSpider = true;
    while (hasUseSpider) {
        const spider = SpiderPool.getSpider();
        if (spider) {
            list.push(runner(spider));
        } else {
            hasUseSpider = false;
        }
    }
    await Promise.all(list);
    log('finish tasks count: ' + SUCCESS_COUNT + '. Failure tasks count: ' + FAIL_COUNT);
    log(`over: cost ` + (Date.now() - time) + 'ms');
}

async function runner(spider) {
    let loop = true;
    let key = null;
    let COUNT = 0;
    while (loop) {
        await delay(700);
        COUNT += 1;
        let retryCount = 0;
        const time = +new Date();
        key = key || await redisSvc.spop('taskSet');
        log(`task start ${key}. [spider-${spider.id}]`);
        if (!key) {
            log('key ehausted.');
            return spider.release();
        }
        const task = await redisSvc.hget('taskHash', key);
        const vistor = tasks[TASK_MAP[task.taskType]].vistor;
        const ua = tasks[TASK_MAP[task.taskType]].ua;
        if (vistor) {
            spider.init({
                url: HOST_NAME + task.url,
                vistor,
                log,
                ua
            });
            while (retryCount < 2) {
                try {
                    retryCount && await delay(2000);
                    retryCount && log(`task ${key} retry ${retryCount} [spider-${spider.id}]`);
                    await spider.start();
                    await redisSvc.sadd('taskSuccessSet', key);
                    retryCount = 2;
                } catch (e) {
                    log(`error, task ${key} failure: ` + e + ` [spider-${spider.id}]`);
                    retryCount += 1;
                    if (retryCount >= 2) {
                        log(`error, task ${key} failureSet: ` + e + ` [spider-${spider.id}]`);
                        await putFalureTask(task);
                    }
                }
            }
        }
        log(`task end ${key}: cost ` + (Date.now() - time) + `ms. [spider-${spider.id}]`);
        key = await redisSvc.spop('taskSet');
        if (key) {
            if (COUNT <= TASK_STEP_LIMIT) {
                loop = true;
            } else {
                SUCCESS_COUNT += COUNT;
                log(`task_step_limt over, delay 10mins`);
                await delay(8 * 60 * 1000);
                COUNT = 0;
                loop = true;
            }
        } else {
            loop = false;
        }
    }
    return spider.release();
}

async function putFalureTask(task) {
    FAIL_COUNT += 1;
    await redisSvc.sadd('failureSet', task.url);
}

begin().then(() => process.exit(0));
