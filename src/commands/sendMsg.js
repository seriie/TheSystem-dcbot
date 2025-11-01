export const sendMsg = async (msg, args) => {
  const allowedRoleId = process.env.DEVELOPER_ROLE_ID;

  if (!msg.member.roles.cache.has(allowedRoleId)) {
    await msg.reply("🚫 You are not allowed.");
    return;
  }

  myLogs(`${msg.author.displayName} trying to send dms`);
  const [id, ...messageParts] = args.split(" ");
  const text = messageParts.join(" ");

  if (!id || !text) {
    return msg.reply("❌ Invalid format! Use: `$sendmsg {id} {message}`");
  }

  try {
    const user = await client.users.fetch(id);
    await user.send(text);
    msg.reply(`✅ Message sent to **${user.displayName}**`);
    myLogs(`✅  Message sent to **${user.displayName}**`);
  } catch (err) {
    myLogs(err);
    msg.reply("⚠️ Failed to send DM! recheck the ID!");
  }
};
