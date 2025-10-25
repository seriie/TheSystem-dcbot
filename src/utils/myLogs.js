export const myLogs = (text) => {
  const now = new Date();
  let dateTime = now.toLocaleString();

  dateTime = dateTime.replace(/[\,]/g, "");
  console.log(`${dateTime} | ${text}`);
};
