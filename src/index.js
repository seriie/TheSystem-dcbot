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

//  Clubs rankings
import {
  handleClubRankButton,
  handleClubSelection,
  handleClubResultModal,
  addClubsRankEmbed
} from "./commands/addClubsRank.js";
import { handleRegisterClubs } from "./commands/registerClubs.js";
import { handleRegisterClubModal } from "./commands/registerClubs.js";

//  Match summary
import { addSummaryEmbed, handleSummaryButton, handleSummaryModal, handleSummarySelection } from "./commands/addSummary.js";
import { showAllSummaries } from "./commands/showAllSummeries.js";

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

// const userIds = [
//   '1302966601062285391',
//   '862553441292910633',
//   '1204771187608256586'
// ];

client.once("clientReady", async () => {
  myLogs(`✅  Logged in as ${client.user.tag}`);

  //     for (const id of userIds) {
  //     try {
  //       const user = await client.users.fetch(id);
  //       await user.send(`
  //         We invited you to our secret server that still developing, and we currently need a good mod for this secret server. so i wanna ask you if you want to be our mod in this secret server, join this server if u agree and please do not share this to the others
  // https://discord.gg/7mU692ucm
  //         `);
  //       console.log(`✅ DM terkirim ke ${user.tag}`);
  //     } catch (error) {
  //       console.error(`❌ Gagal kirim DM ke ID ${id}:`, error.message);
  //     }
  //   }

  // Add rank
  await addRankEmbed(client);

  // Clubs rank
  await addClubsRankEmbed(client);

  // Register player
  await sendRegisterMessage(client);

  // Rank concept
  await rankingConceptEmbed(client);

  // Match summary
  await addSummaryEmbed(client);
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
  // Player rankins
  await handleRankButton(interaction);
  await handleSelectPlayer(interaction);
  await handleModalSubmit(interaction);

  // Clubs rank
  await handleClubRankButton(interaction);
  await handleClubSelection(interaction);
  await handleClubResultModal(interaction);
  await handleRegisterClubs(interaction)
  await handleRegisterClubModal(interaction);

  // Register
  await handleRegisterButton(interaction);
  await handleRegisterModal(interaction);

  // Match summary
  await handleSummaryButton(interaction);
  await handleSummaryModal(interaction);
  await handleSummarySelection(interaction);
  await showAllSummaries(interaction);
});

client.login(process.env.TOKEN);

export default app;
