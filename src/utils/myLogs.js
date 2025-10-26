// import fs from "fs";
// import path from "path";

// const logDir = path.join(process.cwd(), "logs");
// const logFile = path.join(logDir, "app.json");

export const myLogs = (text) => {
  const now = new Date();
  let dateTime = now.toISOString().replace(/[\,]/g, "");
  const logLine = `${dateTime} | ${text}`;

  console.log(logLine);

//   try {
//     if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

//     const logData = { [dateTime]: text };

//     if (!fs.existsSync(logFile)) {
//       fs.writeFileSync(logFile, JSON.stringify([logData], null, 2));
//     } else {
//       const existing = JSON.parse(fs.readFileSync(logFile, "utf8"));
//       existing.push(logData);
//       fs.writeFileSync(logFile, JSON.stringify(existing, null, 2));
//     }
//   } catch (err) {
//     console.error("⚠️ Failed to write file:", err);
//   }
};
