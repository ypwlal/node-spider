const cheerio = require('cheerio');
const Spider = require('./spider');
const TaskPool = require('./pools/taskPool');

function createTask(data) {
    return ({
        url,
        vistor,
        flag
    });
}

const taskList = new TaskPool(25000);

const tasks = [
    {
        name: 'start',
        page: 'discover/artist',
        vistor: (html) => {
            const $ = cheerio.load(html);
            $('.blk .cat-flag').forEach(function(){
                const url = $(this).attr('href');
                const artist_tag = $(this).text();
                taskList.push(createTask({
                    taskType: 'artist',
                    url: url + '&initial=0',
                    data: {
                        artist_tag
                    }
                }));
                for (let i = 65; i < 90; i += 1) {
                    taskList.push(createTask({
                        taskType: 'artist',
                        url: url + `&initial=${i}`,
                        data: {
                            artist_tag
                        }
                    }));
                }
            });
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


const spider = new Spider({
    onRequest: async (url) => {

    },

    onVistor: (url ,html) => {

    },

    onSave: (data) => {

    },

    onComplete: () => {

    },

    onError: (error) => {

    }
});

