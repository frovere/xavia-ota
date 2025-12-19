import pino from 'pino';

const pinoPretty =
  process.env.NODE_ENV === 'production'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            messageFormat: '[{loggerName}] {msg}',
            translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
          },
        },
      };

const logger = pino({
  ...pinoPretty,
  base: {
    env: process.env.NODE_ENV,
    loggerName: 'app',
  },
});

export const getLogger = (module: NodeModule | string) => {
  // if no custom name provided, use filename and parent folder

  const name = typeof module === 'string' ? module : module.filename.split('/').slice(-2).join('/');

  return logger.child({ loggerName: name });
};
