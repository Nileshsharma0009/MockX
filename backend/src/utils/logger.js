import winston from "winston";
import path from "path";
import fs from "fs";

const logDir = "logs";

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  })
);

// General Application Logger
export const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      )
    }),
    // Error file logs
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined file logs
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Specific AI Revenue Recovery Logs
export const recoveryLogger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level} [AI Recovery]: ${message}`;
        })
      )
    }),
    new winston.transports.File({
      filename: path.join(logDir, "recovery.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Specific HTTP Network Logs
export const httpLogger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "http.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});
