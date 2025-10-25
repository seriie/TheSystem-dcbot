import express from "express";
import { Client, GatewayIntentBits, EmbedBuilder, Partials } from "discord.js";
import { showRankEmbed } from "./commands/showRank.js";
import { showUsers } from "./commands/showUsers.js";
import {
  sendRegisterMessage,
  handleRegisterButton,
  handleRegisterModal,
} from "./messages/register.js";

//  Ranking concept
import { rankingConceptEmbed } from "./messages/rankingConcept.js";

//  Rankings
import { addRankEmbed } from "./messages/addRank.js";

import {
  handleRankButton,
  handleSelectPlayer,
  handleModalSubmit,
} from "./commands/addrank.js";

import { myLogs } from "./utils/myLogs.js";

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
  myLogs(`✅  Logged in as ${client.user.tag}`);

  await addRankEmbed(client);
  await sendRegisterMessage(client);
  await rankingConceptEmbed(client);
});

client.on("messageCreate", async (msg) => {
  const channel = msg.channel;

  if (msg.content.startsWith("$")) {
    const command = msg.content.slice(1).split(" ")[0];
    const args = msg.content.slice(command.length + 1).trim();

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


          try {
            const fetched = await channel.messages.fetch({ limit: 100 });
            await channel.bulkDelete(fetched);

            let deleted;
            do {
              deleted = await channel.bulkDelete(100, true);
            } while (deleted.size > 0);

            const confirmMsg = await channel.send(`✅ All message deleted!`);

            setTimeout(() => {
              confirmMsg.delete().catch(() => {});
            }, 3000);
          } catch (err) {
            myLogs("❌  ", err);
            msg.reply("❌ Failed to delete message (might be too old 14 day).");
          }
          break;

        case "showrank":
          // if(msg.author.id == "1392481215205871618") {
          //   return msg.reply("STFU MIZU NOOOBBB")
          // } else if(msg.author.id == "878215711779090443") {
          //   msg.reply("YESS MY GOAT HEARTLY :heart:")
          // }
          const limit = parseInt(args[0]) || 20;
          const result = await showRankEmbed(limit);
          await channel.send(result);
          break;
        default:
          msg.reply(`Couldn't find **${command}** command.`);
      }
    } catch (error) {
      myLogs("❌  Error executing command:" + error);
      msg.reply("There was an error trying to execute that command!");
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  // Rankins
  await handleRankButton(interaction);
  await handleSelectPlayer(interaction);
  await handleModalSubmit(interaction);

  // Register
  await handleRegisterButton(interaction);
  await handleRegisterModal(interaction);
});

client.login(process.env.TOKEN);

export default app;
