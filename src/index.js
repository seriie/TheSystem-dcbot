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

import { showClubRankEmbed } from "./commands/showClubRank.js";

//  Match summary
import {
  addSummaryEmbed,
  handleSummaryButton,
  handleSummaryModal,
  handleSummarySelection,
} from "./commands/addSummary.js";
import { delSummary } from "./commands/deleteSummary.js";
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
          await showUsers(msg, args);
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

            // Update rank_verified = false
            const { error: updateError } = await supabase
              .from("users")
              .update({ rank_verified: false })
              .eq("rank_verified", true);

            if (updateError) {
              myLogs(
                "❌ Failed to update rank_verified: " +
                  JSON.stringify(updateError)
              );
              await msg.reply("⚠️ Failed to update rank_verified field.");
              return;
            }

            const { error: deleteError } = await supabase
              .from("rankings")
              .delete()
              .neq("id", 0);

            if (deleteError) {
              myLogs(
                "❌ Failed to reset player rankings: " +
                  JSON.stringify(deleteError)
              );
              await msg.reply("⚠️ Failed to delete rank data.");
              return;
            }

            myLogs("✅ All rank players have been deleted.");
            await msg.reply(
              "✅ All player rank data deleted, and rank_verified reset!"
            );
          } catch (e) {
            myLogs("💥 Unexpected error while trying to reset: " + e.message);
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
        case "delsummary":
          delSummary(msg, args)
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
        case "showclubrank":
          const clubLimit = parseInt(args[0]) || 10;
          const clubResult = await showClubRankEmbed(clubLimit);
          await channel.send(clubResult);
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
  try {
    const allowedRoleId = [
      process.env.OFFICIAL_RANKER_ROLE_ID,
      process.env.LEAD_RANKER_ROLE_ID,
    ];

    const member = interaction.member;
    const hasAccess = member?.roles?.cache?.some((role) =>
      allowedRoleId.includes(role.id)
    );

    await handleRegisterButton(interaction);
    await handleRegisterModal(interaction);

    if (hasAccess) {
      await handleClubRankButton(interaction);
      await handleClubSelection(interaction);
      await handleClubResultModal(interaction);
      await handleRegisterClubs(interaction);
      await handleRegisterClubModal(interaction);
      await handleRankButton(interaction);
      await handleSelectPlayer(interaction);
      await handleModalSubmit(interaction);
      await handleSummaryButton(interaction);
      await handleSummaryModal(interaction);
      await handleSummarySelection(interaction);
      await showAllSummaries(interaction);
    } else if (
      interaction.customId?.startsWith("rank") ||
      interaction.customId?.startsWith("summary")
    ) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "🚫 You don't have permission to do this.",
          ephemeral: true,
        });
      }
      myLogs(`${interaction.user.username} doesn't have perms.`);
    }
  } catch (err) {
    myLogs("❌  Interaction handler error:" + JSON.stringify(err, null, 2));
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "⚠️ Internal error.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.TOKEN);

export default app;
