const request = require('request');
const randomUserAgent = require('../utils/ua');

class Spider {
    constructor({ id = 0, onRelease }) {
        this.url = null;
        this.vistor = null;
        this.onRelease = onRelease;
        this.id = id;
    }

    init({
        url,
        data,
        vistor = () => {},
        log = () => {},
        ua
    }) {
        this.url = url;
        this.vistor = vistor;
        this.data = data;
        this.ua = ua;
        this.log = (str) => log(str + ` [spider-${this.id}]`);
    }

    release() {
        this.url = null;
        this.vistor = null;
        this.data = null;
        this.ua = '';
        this.log = () => {};
        this.onRelease && this.onRelease();
    }

    async start() {
        const html = await this.request(this.url, this.ua);
        await this.vistor(html, this.log);
    }

    request(url, ua) {
        return new Promise((resolve, reject) => {
            this.log('request begin...');
            const time = +new Date();
            request({
                url,
                method: 'get',
                headers: {
                    Referer: 'http://music.163.com',
                    'User-Agent': randomUserAgent(ua)
                }
            }, (err, res, body) => {
                if (err || !body) {
                    this.log('request error over, cost ' + (Date.now() - time) + 'ms');
                    reject(err);
                } else {
                    this.log('request over, cost ' + (Date.now() - time) + 'ms');
                    resolve(body);
                }
            })
        });
    }

}

module.exports = Spider;
