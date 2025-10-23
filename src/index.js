import express from "express";
import { Client, GatewayIntentBits, EmbedBuilder, Partials } from "discord.js";
import { showRankEmbed } from "./commands/showRank.js";
import { showUsers } from "./commands/showUsers.js";
import {
  sendRegisterMessage,
  handleRegisterButton,
  handleRegisterModal,
} from "./commands/register.js";
import { rankingConceptEmbed } from "./commands/rankingConcept.js";

const app = express();
const PORT = process.env.PORT || 3000;

import dotenv from "dotenv";

dotenv.config();

app.get("/", (req, res) => {
  res.send("Bot API is running! 💫");
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  await sendRegisterMessage(client);
  await rankingConceptEmbed(client);
});

client.on("messageCreate", async (msg) => {
  if (msg.content.startsWith("$")) {
    const command = msg.content.slice(1).split(" ")[0];

    try {
      switch (command) {
        case "ping":
          msg.reply("Pong!");
          break;
        case "users":
          await showUsers(msg);
          break;
        case "verify":
          msg.reply("Verification process started.");
          break;
        case "rank":
          break;
        case "bulkdelete":
          if (!msg.member.permissions.has("ManageMessages")) {
            return msg.reply(
              "❌ U don't have permissions to use this command!"
            );
          }

          const channel = msg.channel;

          try {
            // Fetch semua pesan
            const fetched = await channel.messages.fetch({ limit: 100 });
            await channel.bulkDelete(fetched);

            // Loop buat hapus sisa pesan (karena bulkDelete maksimal 100 per kali)
            let deleted;
            do {
              deleted = await channel.bulkDelete(100, true);
            } while (deleted.size > 0);

            const confirmMsg = await channel.send(`✅ All message deleted!`);

            // Hapus pesan konfirmasi setelah 3 detik
            setTimeout(() => {
              confirmMsg.delete().catch(() => {});
            }, 3000);
          } catch (err) {
            console.error(err);
            msg.reply("❌ Failed to delete message (might be too old 14 day).");
          }
          break;

        case "showrank":
          const embed = showRankEmbed();
          msg.reply({ embeds: [embed] });
          break;
        default:
          msg.reply(`Couldn't find **${command}** command.`);
      }
    } catch (error) {
      console.error("Error executing command:", error);
      msg.reply("There was an error trying to execute that command!");
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  await handleRegisterButton(interaction);
  await handleRegisterModal(interaction);
});

client.login(process.env.TOKEN);

export default app;