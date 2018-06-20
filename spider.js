const request = require('request');

class Spider {
    constructor({
        url,
        data,
        vistor = () => {}
    }) {
        this.url = url;
        this.vistor = vistor;
    }

    release = () => {

    }

    start = async () => {
        try {
            const html = await this.request(this.url);
            this.vistor(html);
        } catch (err) {
            console.log(err);
        }
    }

    request = () => {

    }

    save = (data) => {
        this.onSave(data);
    }

}

module.exports = Spider;
