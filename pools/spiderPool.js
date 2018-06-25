const Spider = require('./spider');

class SpiderPool {
    constructor(size) {
        this.size = size;
        this.poolSize = 0;
        this.pool = [];
    }

    getSpider() {
        if (this.poolSize < this.size) {
            const spider = new Spider({
                id: this.poolSize,
                onRelease: () => this.pool.push(spider)
            });
            this.poolSize += 1;
            this.pool.push(spider);
        }
        return this.pool.shift();
    }
}

module.exports = new SpiderPool(3);
