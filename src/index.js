import express from "express";
import { supabase } from "./config/supabase.js";
import { myLogs } from "./utils/myLogs.js";
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
  addClubsRankEmbed,
} from "./commands/addClubsRank.js";
import { handleRegisterClubs } from "./commands/registerClubs.js";
import { handleRegisterClubModal } from "./commands/registerClubs.js";

//  Match summary
import {
  addSummaryEmbed,
  handleSummaryButton,
  handleSummaryModal,
  handleSummarySelection,
} from "./commands/addSummary.js";
import { showAllSummaries } from "./commands/showAllSummeries.js";

import {
  handleRankButton,
  handleSelectPlayer,
  handleModalSubmit,
} from "./commands/addrank.js";

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
        case "sendmsg":
          const allowedRoleId = process.env.DEVELOPER_ROLE_ID;

          if (!msg.member.roles.cache.has(allowedRoleId)) {
            await msg.reply("🚫 You are not allowed.");
            return;
          }

          myLogs(`${msg.author.displayName} trying to send dms`);
          const [id, ...messageParts] = args.split(" ");
          const text = messageParts.join(" ");

          if (!id || !text) {
            return msg.reply(
              "❌ Invalid format! Use: `$sendmsg {id} {message}`"
            );
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
          break;
        case "resetrank":
          try {
            const allowedRoleId = process.env.OFFICIAL_RANKER_ROLE_ID;

            if (!msg.member.roles.cache.has(allowedRoleId)) {
              await msg.reply("🚫 You are not allowed.");
              return;
            }

            const { err } = await supabase
              .from("users")
              .update({ rank_verified: false });

            const { error } = await supabase
              .from("rankings")
              .delete()
              .neq("id", 0);

            if (error) {
              myLogs(
                "❌ Failed to reset player rankings: " + JSON.stringify(error)
              );

              if (err) {
                myLogs(
                  "❌ Failed to update rank_verified: " + JSON.stringify(error)
                );
              }

              await msg.reply("⚠️ Failed to delete rank data.");
              return;
            }

            myLogs("✅ All rank players has been deleted.");
            await msg.reply(
              "✅ All data **player rank** deleted from database."
            );
          } catch (e) {
            myLogs("💥 Unexpected error saat reset rank: " + e.message);
            await msg.reply("💥 Error while trying to delete data.");
          }
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
  // ID role yang boleh akses rank & summary
  const allowedRoleId = process.env.OFFICIAL_RANKER_ROLE_ID;
  const member = interaction.member;

  const hasAccess = member?.roles?.cache?.has(allowedRoleId);

  await handleRegisterButton(interaction);
  await handleRegisterModal(interaction);

  if (hasAccess) {
    await handleClubRankButton(interaction);
    await handleClubSelection(interaction);
    await handleClubResultModal(interaction);
    await handleRegisterClubs(interaction);
    await handleRegisterClubModal(interaction);
  }

  if (hasAccess) {
    await handleRankButton(interaction);
    await handleSelectPlayer(interaction);
    await handleModalSubmit(interaction);
  }

  if (hasAccess) {
    await handleSummaryButton(interaction);
    await handleSummaryModal(interaction);
    await handleSummarySelection(interaction);
    await showAllSummaries(interaction);
  } else if (
    interaction.customId?.startsWith("rank") ||
    interaction.customId?.startsWith("summary")
  ) {
    await interaction.reply({
      content: "🚫 You dont have perms to do this.",
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);

export default app;
