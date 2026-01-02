type LogArgs = unknown[];

export const logger = {
  info: (...args: LogArgs) => console.log(...args),
  warn: (...args: LogArgs) => console.warn(...args),
  error: (...args: LogArgs) => console.error(...args),
  debug: (...args: LogArgs) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(...args);
    }
  },
};
