const cheerio = require('cheerio');
const SpiderPool = require('./pools/spiderPool');
const TaskPool = require('./pools/taskPool');
const redisSvc = require('./service/redis');

const HOST_NAME = 'https://music.163.com';

function createTask(data) {
    return ({
        url,
        vistor,
        flag
    });
}

const failTask = [];

const tasks = [
    {
        name: 'start',
        page: '/discover/artist',
        vistor: async (html) => {
            const time = +new Date();
            const list = [];
            console.log('parse begin.');
            const $ = cheerio.load(html);
            $('.blk .cat-flag').map(function(){
                const url = $(this).attr('href');
                const artist_tag = $(this).text();
                list.push({
                    taskType: 'artist',
                    url: url + '&initial=0',
                    data: {
                        artist_tag
                    }
                });
                for (let i = 65; i < 90; i += 1) {
                    list.push({
                        taskType: 'artist',
                        url: url + `&initial=${i}`,
                        data: {
                            artist_tag
                        }
                    });
                }
            });
            
            for (const item of list) {
                try {
                    await redisSvc.sadd('taskSet', item.url);
                    await redisSvc.hset('taskHash', item.url, item);
                } catch (e) {
                    console.log('redis error: ', e);
                    failTask.push(item);
                }
            }
            console.log('parse over, cost ' + (Date.now() - time) + 'ms');
            return list;
        }
    },
    {
        name: 'artist',
        page: (id, type) => `/discover/artist/cat?id=${id}&initial=${type}`,
        vistor: (html) => {
            return [id]
        }
    },
    {
        name: 'artist/album',
        page: (id) => `artist/album?id=${id}&limit=9999`,
        vistor: (html) => {
            return [id]
        }
    },
    {
        name: 'album',
        page: (id) => `/album?id=y${id}&limit=9999`,
        ajax: (id) => `https://music.163.com/weapi/v1/resource/comments/R_SO_3_${id}?csrf_token=`,
        vistor: (html) => {
            return [id]
        }
    },
    {
        name: 'song',
        page: (id) => `song?id=${id}`,
        ajax: (id) => `https://music.163.com/weapi/v1/resource/comments/R_SO_4_${id}?csrf_token=`,
        vistor: (html) => {
            return {}
        }
    },
    {
        name: 'artistUser',
        page: (id) => `/user/home?id=${id}`,
        vistor: (html) => {

        }
    }
];

const taskMap = {
    'artist': 1,
    'artist/album': 2,
    'album': 3,
    'song': 4,
    'artistUser': 5
};

async function firstPhase() {
    console.log(`第1阶段: ${tasks[0].name}开始`);
    const time = +new Date();
    const task = tasks[0];
    const spider = SpiderPool.getSpider();
    console.log(spider)
    spider.init({
        url: HOST_NAME + task.page,
        vistor: task.vistor
    });
    await spider.start();
    spider.release();
    console.log(`第1阶段: ${task.name}结束, cost ` + (Date.now() - time) + 'ms');
}

async function runner(spider) {
    let loop = true;
    let key = null;
    while (loop) {
        const time = +new Date();
        key = key || await redisSvc.spop('taskSet');
        console.log(`task start ${key}`);
        if (!key) {
            return spider.release();
        }
        const task = await redisSvc.hget('taskHash', key);
        const vistor = tasks[taskMap[task.taskType]];
        if (vistor) {
            spider.init({
                url: HOST_NAME + task.url,
                vistor
            });
            await spider.start();
        }
        console.log(`task end ${key}: cost ` + (Date.now() - time) + 'ms');
        // key = await redisSvc.spop('taskSet');
        loop = false; //!!key;
    }
    return spider.release();
}

async function begin() {
    await firstPhase();
    console.log('begin');
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
    await Promise.all(list)
    console.log(`over: cost ` + (Date.now() - time) + 'ms');
}

begin().catch(err => {
    console.log('begin error: ' + err);
    process.exit(1);
})
