const Redis = require('ioredis');
const redisurl = process.env.REDIS_URL || "localhost:6379";
const redis = new Redis(redisurl);
const redisport = 6379;

const startingAmount = 1000;
const interval = 3000;

const updateBookStatus = function (amount) {
  getBookStatus((result) => {
    let status = parseInt(result) + amount;
    redis.set('bookstatus', status);
    console.log("Updating book status by ("+amount+"). Current Energy: "+ status);
  });
};
module.exports.updateBookStatus = updateBookStatus;

const getBookStatus = function (cb) {
  redis.get('bookstatus', function (err, result) {
    console.log("Book Status: " + result);
    cb(result)
  });
};
module.exports.getBookStatus = getBookStatus;

redis.set('bookstatus', startingAmount);
setInterval(() => {updateBookStatus(-1)}, 5000);
