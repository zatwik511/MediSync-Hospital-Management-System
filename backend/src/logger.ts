import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
  isDev
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {
        level: process.env.LOG_LEVEL || 'info',
      }
);

export default logger;
