class TaskPool {
    constructor(size) {
        this.size = size;
        this.taskList = [];
    }
    
    shift() {
        return this.taskList.shift();
    }

    push(data) {
        if (this.taskList.length < this.size) {
            this.taskList.push(data);
            return this.size - this.taskList.length;
        }
        return 0;
    }
}

module.exports = TaskPool;
