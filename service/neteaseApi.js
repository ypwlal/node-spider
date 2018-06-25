// reference
const Encrypt = require('../utils/encrypt');
const randomUserAgent = require('../utils/ua');
const querystring = require('querystring');
const request = require('request');

function getSongComments(id) {
    const data = {
        offset: 0,
        rid: id,
        limit: 20,
        csrf_token: ""
    };
    return new Promise((resolve, reject) => {
        createWebAPIRequest(
            true,
            data,
            resolve,
            reject
        )
    });
}

function getAlbumComments(id) {
    const data = {
        offset: 0,
        rid: id,
        limit: 20,
        csrf_token: ""
    };
    return new Promise((resolve, reject) => {
        createWebAPIRequest(
            false,
            data,
            resolve,
            reject
        )
    });
}

function createWebAPIRequest(
    isSong = true, 
    data,
    callback,
    errorcallback
) {
    // console.log(cookie);
    const cryptoreq = Encrypt(data);
    const options = {
        url: `http://music.163.com/weapi/v1/resource/comments/${isSong ? 'R_SO_4_' : 'R_AL_3_'}${data.rid}/?csrf_token=`,
        method: 'POST',
        headers: {
            Accept: "*/*",
            "Accept-Language": "zh-CN,zh;q=0.8,gl;q=0.6,zh-TW;q=0.4",
            Connection: "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: "http://music.163.com",
            Host: "music.163.com",
            "User-Agent": randomUserAgent()
        },
        body: querystring.stringify({
            params: cryptoreq.params,
            encSecKey: cryptoreq.encSecKey
        })
    };
    console.log(
        `[request] ${options.method} ${options.url} proxy:${options.proxy}`
    );
  
    request(options, function(error, res, body) {
        if (error) {
            console.error(error);
            errorcallback(error);
        } else {
        //解决 网易云 cookie 添加 .music.163.com 域设置。
        //如： Domain=.music.163.com
        let cookie = res.headers["set-cookie"];
        if (Array.isArray(cookie)) {
            cookie = cookie
                .map(x => x.replace(/.music.163.com/g, ""))
                .sort((a, b) => a.length - b.length);
        }
        let result;
        try {
            result = body ? JSON.parse(body) : '';
        } catch (e) {
            result = '';
        }
        callback(result, cookie);
      }
    });
}
module.exports = {
    getSongComments,
    getAlbumComments
}
