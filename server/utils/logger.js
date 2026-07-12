const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format to handle extra arguments (splat) and format Error objects
const customFormat = printf((info) => {
  const { level, message, timestamp, stack } = info;
  let out = `${timestamp} [${level}]: `;
  
  if (stack) {
    const normalizedStack = stack.toLowerCase();
    const normalizedMessage = message.toLowerCase();
    
    if (normalizedStack.includes(normalizedMessage) || normalizedStack.replace('error: ', '').startsWith(normalizedMessage)) {
      out += stack;
    } else {
      out += `${message}\n${stack}`;
    }
  } else {
    out += message;
  }
  
  // Handle splat (extra arguments passed to logger)
  const splat = info[Symbol.for('splat')];
  if (splat && splat.length > 0) {
    const extra = splat.map(arg => {
      if (arg instanceof Error) {
        if (stack && stack.includes(arg.message)) {
          return '';
        }
        return arg.stack || arg.message;
      }
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return arg;
    }).filter(Boolean).join(' ');
    
    if (extra) {
      out += ' ' + extra;
    }
  }
  
  return out;
});

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), customFormat),
  }),
];

// File transports only work on non-serverless environments (Vercel has a read-only filesystem)
if (!process.env.VERCEL) {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
    })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports,
});

module.exports = logger;
