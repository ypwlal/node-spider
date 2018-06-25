const { tasks, TASK_MAP, HOST_NAME } = require('./task');;
const SpiderPool = require('./pools/spiderPool');
const delay = require('./utils/delay.js');
const fork = require('child_process').fork;
const cpus = require('os').cpus();
const path = require('path');

process.on('exit', function() {
    for (const pid in readWokers) {
        readWokers[pid].kill();
    }
});

async function firstPhase() {
    const task = tasks[TASK_MAP.start];
    console.log(`第1阶段: ${task.name}开始`);
    const time = +new Date();
    const spider = SpiderPool.getSpider();
    spider.init({
        url: HOST_NAME + task.page,
        vistor: task.vistor,
        ua: task.ua
    });
    try {
        await spider.start();
    } catch (e) {
        console.log('第一阶段错误', e)
    }
    
    spider.release();
    console.log(`第1阶段: ${task.name}结束, cost ` + (Date.now() - time) + 'ms');
}

const readWokers = {};
const writeWokers = {};
const startTime = +new Date();

function createReadWorker() {
    const readWoker = fork(path.join(__dirname, './workers/readWorker.js'));
    readWoker.on('exit', function() {
        console.log('ReadWorker ' + readWoker.pid + ' exited.');
        delete readWokers[readWoker.pid];
        console.log(Object.keys(readWokers).length + ' ReadWorkers left.');
        if (!Object.keys(writeWokers).length && !Object.keys(readWokers).length) {
            console.log('total time: ' + (Date.now() - startTime) + 'ms.');
            process.exit(0);
        }
    });
    readWokers[readWoker.pid] = readWoker;
    console.log('Create ReadWorker. pid: ' + readWoker.pid);
}

function createWriteWorker() {
    const worker = fork(path.join(__dirname, './workers/writeWorker.js'));
    worker.on('exit', function() {
        console.log('WriteWorker ' + worker.pid + ' exited.');
        delete writeWokers[worker.pid];
        console.log(Object.keys(writeWokers).length + ' WriteWorkers left.');
        if (!Object.keys(writeWokers).length && !Object.keys(readWokers).length) {
            console.log('total time: ' + (Date.now() - startTime) + 'ms.');
            process.exit(0);
        }
    });
    writeWokers[worker.pid] = worker;
    console.log('Create WriteWorker. pid: ' + worker.pid);
}

async function begin() {
    try {
        await firstPhase();
        await delay(5000);
    } catch (err) {
        console.log(err);
        // process.exit(1);
    }
    
    const halfCpus = ~~(cpus.length / 2);
    for (let i = 0; i < (cpus.length - 1) ; i += 1) {
        createReadWorker();
    }
    await delay(5000);
    for (let i = 0; i < 1; i += 1) {
        createWriteWorker();
    }
}

async function test() {
    const task = tasks[TASK_MAP['album']];
    console.log(`${task.name}开始`);
    console.log(HOST_NAME + task.page(39707049))
    const time = +new Date();
    try {
        const spider = SpiderPool.getSpider();
        spider.init({
            url: HOST_NAME + task.page(39707049),
            vistor: task.vistor,
            ua: task.ua
        });
        await spider.start();
        spider.release();
    } catch (e) {
        console.log('error, failureSet: ', e);
        // const _task = {
        //     url: HOST_NAME + task.page(1187003),
        //     taskType: 'song'
        // }
        // await putFalureTask(_task);
    }
    console.log(`${task.name}结束, cost ` + (Date.now() - time) + 'ms');
    process.exit(1);
}

async function putFalureTask(task) {
    await redisSvc.sadd('failureSet', task.url);
}

begin().catch(err => {
    console.log('begin error: ' + err);
    process.exit(1);
});
// firstPhase()
// test()
