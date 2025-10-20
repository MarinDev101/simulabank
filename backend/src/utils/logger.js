const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors, colorize } = format;
const { log } = require('../config/env.config');

const myFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: log.level,
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    myFormat
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
