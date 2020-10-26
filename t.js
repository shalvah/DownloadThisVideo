
require('dotenv').config()
const cache = require('./src/services/cache');
cache.scanAsync(0, 'match', 'tweet-14*', 'count', 1000000)
    .then(async r => {
        return await Promise.all(r[1].map(t => {
            console.log(t);
            return cache.ttlAsync(t);
        })).then(res => console.log(res)).then(process.exit);
        //     return cache.ttlAsync(t);
        // })).then(res => console.log(res.find(p => p > -1))).then(process.exit);
    })