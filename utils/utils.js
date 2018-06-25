async function retryFn({
    fn, 
    retryTime = 0,
    stepTime, 
    log = console.log,
    beforeRetry
}) {
    let count = 0;
    let res = null;
    while (count < retryTime) {
        try {
            count && beforeRetry && await beforeRetry();
            res = await fn();
        } catch (err) {
            log && log(err);
            count += 1;
        }
    }
    return res;
}

module.exports = retryFn;
