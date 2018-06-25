* create task base url // flatten
    - start
    - category
    - artist
    - artist/album
    - album
    - song

* task // the abstract of works. A task is used to create a new spider job and record the data in redis for writers or reader workers.
    - taskType // spider job type
    - url // as key
    - data // something for making new tasks or writing into redis

* worker
    - readWorker
        - for multi spider jobs
        - read/write redis
    - writeWorker
        - for multi db jobs
        - read redis, write db

* pools
    - child_process
    - ua
    - spiderPool
    - writer // for a single db job

* redis
    - share data between child_process
    - cache data for writing into mongodb
    - Set for keys and Hash for detail data

* error
    - the key of a error job will be back to failureSet in redis.
    - check failureSet key to find the htmlparse error.

* tips
    - useragent for pc/mobile
        - while mobile is base on react + redux + ssr
    - use only one type for htmlparse

```javascript
    // prepare your redis and mongodb
    npm i
    npm start
```
