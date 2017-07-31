const Redis = require('ioredis');
const redisurl = process.env.REDIS_URL || "localhost:6379";
const redis = new Redis(redisurl);
const redisport = 6379;

const startingAmount = process.env.START_AMOUNT || 20;
const interval = process.env.BOOK_INTERVAL || 2000;

const updateBookStatus = function (amount) {
  getBookStatus((result) => {
    let status = parseInt(result) + amount;
    if (status < 0) { status = 0; }
    redis.set('bookstatus', status);
  });
};
module.exports.updateBookStatus = updateBookStatus;

const getBookStatus = function (cb) {
  redis.get('bookstatus', function (err, result) {
    cb(result)
  });
};
module.exports.getBookStatus = getBookStatus;

redis.get('bookstatus', function (err, result) {
  let status = parseInt(result);
  if(status == 0) {
    redis.set('bookstatus', startingAmount);
  }
});

setInterval(() => {updateBookStatus(-1)}, interval);
