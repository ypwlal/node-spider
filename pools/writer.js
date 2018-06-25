const redisSvc = require('../service/redis');
const MODELS = require('../model');

function adapter(modelType, { id, ...res }) {
    return ({
        id: parseInt(id, 10),
        ...res
    });
}

async function writer(modelType, log = console.log) {
    const model = MODELS[modelType];
    const key = await redisSvc.spop(modelType + 'Set');
    if (!key) {
        log(modelType + ' key exhausted.');
        return 'end';
    }
    try {
        const data = await redisSvc.hget(modelType + 'Hash', key);
        const condition = { id: key };
        const getRes = await model.findOne(condition);
        if (getRes) {
            await model.update(condition, {
                $set: adapter(modelType, data)
            })
        } else {
            await model.create(adapter(modelType, data))
        }
        await redisSvc.sadd(modelType + 'SuccessSet', key);
        return 'success';
    } catch (err) {
        log(`db ${modelType}-${key} error: ` + err);
        await putFalureModel(modelType, key);
        return 'failure';
    }
}

async function putFalureModel(modelType, key) {
    try {
        await redisSvc.sadd(modelType + 'FailureSet', key);
    } catch (e) {
        log(`db ${modelType}-${key} failure process: ` + e);
    }
}

// writer('Category').then(err => {
//     process.exit(1);
// });


module.exports = writer;
