import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "src", "logs");
const logFile = path.join(logDir, "app.log");

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

export function writeLog(message) {
  const logMessage = `[${new Date().toLocaleString()}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage, "utf8");
  console.log(logMessage.trim());
}
