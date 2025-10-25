import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "src", "logs");
const logFile = path.join(logDir, "app.json");

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function readLogs() {
  try {
    const data = fs.readFileSync(logFile, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export function writeLog(message, type = "INFO") {
  const logs = readLogs();

  const newLog = {
    time: new Date().toLocaleString("id-ID"),
    type,
    message,
  };

  logs.push(newLog);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), "utf8");

  console.log(`[${newLog.time}] [${type}] ${message}`);
}