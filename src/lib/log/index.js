const winston = require('winston');
const logger = winston.createLogger({
  level: process.env.LOGLEVEL ? process.env.LOGLEVEL : 'info',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});
module.exports = logger;
