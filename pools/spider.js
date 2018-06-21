const request = require('request');
const randomUserAgent = require('../utils/ua');

class Spider {
    constructor({ onRelease }) {
        this.url = null;
        this.vistor = null;
        this.onRelease = onRelease;
    }

    init({
        url,
        data,
        vistor = () => {}
    }) {
        this.url = url;
        this.vistor = vistor;
        this.data = data;
    }

    release() {
        this.url = null;
        this.vistor = null;
        this.data = null;
        this.onRelease && this.onRelease();
    }

    async start() {
        try {
            const html = await this.request(this.url);
            await this.vistor(html);
        } catch (err) {
            console.log('spider start error: ' + err);
        }
    }

    request(url) {
        return new Promise((resolve, reject) => {
            console.log('request begin...');
            const time = +new Date();
            request({
                url,
                method: 'get',
                headers: {
                    Referer: 'http://music.163.com',
                    'User-Agent': randomUserAgent()
                }
            }, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('request over, cost ' + (Date.now() - time) + 'ms');
                    resolve(body);
                }
            })
        });
    }

}

module.exports = Spider;
