const cheerio = require('cheerio');
const redisSvc = require('./service/redis');
const { getSongComments, getAlbumComments } = require('./service/neteaseApi');

const HOST_NAME = 'https://music.163.com';

const failTask = [];

const tasks = [
    {
        name: 'start',
        page: '/discover/artist',
        ua: 'PC',
        vistor: async (html, log) => {
            const time = +new Date();
            const list = [];
            const categoryList = [];
            log && log('start parse begin.');
            const $ = cheerio.load(html);
            $('.blk .cat-flag').each(function () {
                const url = $(this).attr('href');
                categoryList.push({
                    id: $(this).attr('data-cat'),
                    name: $(this).text()
                });
                list.push({
                    taskType: 'artist',
                    url: url + '&initial=0'
                });
                for (let i = 65; i < 90; i += 1) {
                    list.push({
                        taskType: 'artist',
                        url: url + `&initial=${i}`,
                    });
                }
            });
            
            for (const item of categoryList) {
                await redisSvc.sadd('CategorySet', item.id);
                await redisSvc.hset('CategoryHash', item.id, item);
            }

            for (const item of list) {
                try {
                    await redisSvc.sadd('taskSet', item.url);
                    await redisSvc.hset('taskHash', item.url, item);
                } catch (e) {
                    log && log('redis error: ', e);
                    failTask.push(item);
                }
            }
            if (!list.length || !categoryList.length) {
                throw new Error('start error.')
            }
            log && log('start parse over, cost ' + (Date.now() - time) + 'ms');
            return list;
        }
    },
    {
        name: 'artist',
        ua: 'PC',
        page: (id, type) => `/discover/artist/cat?id=${id}&initial=${type}`,
        vistor: async (html, log) => {
            const time = +new Date();
            const artistList = [];
            log && log('artist parse begin.');
            const $ = cheerio.load(html);

            $('.nm.nm-icn.f-thide.s-fc0').each(function () {
                const url = $(this).attr('href');
                const artistId = url.match(/id=(.+)/)[1];
                const catId = $('.cat-flag.z-slt').attr('data-cat');
                const catName = $('.cat-flag.z-slt').text();
                const artistName = $(this).text();
                artistList.push({
                    taskType: 'artist/album',
                    url: `/artist/album?id=${artistId}&limit=9999`,
                    data: {
                        id: artistId,
                        catId,
                        catName,
                        name: artistName
                    }
                });
            });
            
            for (const item of artistList) {
                try {
                    await redisSvc.sadd('taskSet', item.url);
                    await redisSvc.hset('taskHash', item.url, item);
                    await redisSvc.sadd('ArtistSet', item.data.id);
                    await redisSvc.hset('ArtistHash', item.data.id, item.data);
                } catch (e) {
                    log && log('redis error: ' + e);
                    failTask.push(item);
                }
            }
            log && log('artist parse over, cost ' + (Date.now() - time) + 'ms');
            return artistList;
        }
    },
    {
        name: 'artist/album',
        page: (id) => `/artist/album?id=${id}&limit=9999`,
        ua: 'PC',
        vistor: async (html, log) => {
            const time = +new Date();
            const list = [];
            log && log('artist/album parse begin.');
            const $ = cheerio.load(html);
            $('.tit.s-fc0').each(function(item) {
                const url = $(this).attr('href');
                list.push({
                    taskType: 'album',
                    url: url + '&limit=9999'
                });
            });
            for (const item of list) {
                try {
                    await redisSvc.sadd('taskSet', item.url);
                    await redisSvc.hset('taskHash', item.url, item);
                } catch (e) {
                    log && log('redis error: ' + e);
                    failTask.push(item);
                } 
            }
            log && log('artist/album parse over, cost ' + (Date.now() - time) + 'ms');
            return list;
        }
    },
    {
        name: 'album',
        page: (id) => `/album?id=${id}&limit=9999`,
        ajax: (id) => `https://music.163.com/weapi/v1/resource/comments/R_SO_3_${id}?csrf_token=`,
        ua: 'MOBILE',
        vistor: async (html, log) => {
            const time = +new Date();
            const list = [];
            log && log('album parse begin.');
            const $ = cheerio.load(html);
            const pageData = decodeReduxState($('body script').html());
            const name = pageData.Album.info.name;
            const artists = pageData.Album.info.artists.filter(item => typeof item == 'object');
            const publishTime = pageData.Album.info.publishTime;
            const picUrl = pageData.Album.info.picUrl;
            const company = pageData.Album.info.company;
            const id = pageData.Album.info.id;
            const { total } = await getAlbumComments(id);
            const data = {
                id,
                name,
                company,
                publishTime,
                commentsCount: total,
                artists,
                picUrl
            }
            pageData.Album.data.map(function(item) {
                list.push({
                    taskType: 'song',
                    url: `/song?id=${item.id}`
                });
            });
            await redisSvc.sadd('AlbumSet', id);
            await redisSvc.hset('AlbumHash', id, data);
            for (const item of list) {
                try {
                    await redisSvc.sadd('taskSet', item.url);
                    await redisSvc.hset('taskHash', item.url, item);
                } catch (e) {
                    log && log('redis error: ' + e);
                    failTask.push(item);
                } 
            }
            log && log('album parse over, cost ' + (Date.now() - time) + 'ms');
            return list;
        }
    },
    {
        name: 'song',
        page: (id) => `/song?id=${id}`,
        ajax: (id) => `https://music.163.com/weapi/v1/resource/comments/R_SO_4_${id}?csrf_token=`,
        ua: 'MOBILE',
        vistor: async (html, log) => {
            const time = +new Date();
            log && log('song parse begin.');
            const $ = cheerio.load(html);
            // redux state
            const pageData = decodeReduxState($('body script').html());
            const artists = pageData.Song.info.song.artists.filter(item => typeof item == 'object');;
            const albumId = pageData.Song.info.song.album.id;
            const id = pageData.Song.info.song.id;
            const name = pageData.Song.info.song.name;
            const publishTime = pageData.Song.info.song.publishTime;
            const duration = pageData.Song.info.song.duration;
            const copyrightId = pageData.Song.info.song.copyrightId;
            const { total } = await getSongComments(id);
            const data = {
                id,
                name,
                commentsCount: total,
                artists,
                albumId,
                publishTime,
                duration,
                copyrightId
            }
            await redisSvc.sadd('SongSet', id);
            await redisSvc.hset('SongHash', id, data);
            log && log('song parse over, cost ' + (Date.now() - time) + 'ms');
        }
    },
    {
        name: 'artistUser',
        page: (id) => `/user/home?id=${id}`,
        vistor: (html) => {

        }
    }
];

function decodeReduxState(str) {
    let _str = str
        .replace('window.REDUX_STATE = ', '')
        .replace(/window.CLIENT_INFO = .+;/, '')
    const start = _str.indexOf('{');
    const end = _str.lastIndexOf(';');
    return JSON.parse(_str.substring(start, end));
}

const TASK_MAP = {
    'start': 0,
    'artist': 1,
    'artist/album': 2,
    'album': 3,
    'song': 4,
    'artistUser': 5
};

module.exports = {
    tasks,
    TASK_MAP,
    HOST_NAME
}