const cheerio = require('cheerio');
const SpiderPool = require('./pools/spiderPool');
const TaskPool = require('./pools/taskPool');

const HOST_NAME = 'https://music.163.com';

function createTask(data) {
    return ({
        url,
        vistor,
        flag
    });
}

const tasks = [
    {
        name: 'start',
        page: '/discover/artist',
        vistor: (html) => {
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
            console.log('parse over, cost ' + (Date.now() - time) + 'ms');
            console.log(list[0]);
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
    }
];

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

async function begin() {
    await firstPhase();
    for (let i = 1; i < tasks.length; i += 1) {
        const time = +new Date();
        console.log(`第${i + 1}阶段: ${tasks[i].name}开始`);
        const spide = new Spider();
        spider.init({
            url: HOST_NAME + tasks[i].page,
            vistor: tasks[i].vistor
        });
        console.log(`第${i + 1}阶段: ${tasks[i].name}结束, cost ` + (Date.now() - time) + 'ms');
    }
}

firstPhase().catch(err => {
    console.log('firstPhase error: ' + err);
    process.exit(1);
})
