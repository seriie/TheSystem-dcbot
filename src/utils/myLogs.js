import fs from "fs";
import path from "path";

const __dirname = path.resolve();

const logDir = path.join(__dirname, "src", "logs");
const logFile = path.join(logDir, "app.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const myLogs = (text) => {
  const now = new Date();
  let dateTime = now.toLocaleString("id-ID");

  dateTime = dateTime.replace(/[\,]/g, "");
  const logText = `${dateTime} | ${text}\n`;

  // tampil juga di console
  console.log(logText.trim());

  fs.appendFileSync(logFile, logText, "utf8");
};
