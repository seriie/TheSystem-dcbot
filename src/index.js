import { myLogs } from "./utils/myLogs.js";
import { Client, GatewayIntentBits, EmbedBuilder, Partials } from "discord.js";

// Player Registration
import {
  sendRegisterMessage,
  handleRegisterButton,
  handleRegisterModal,
  handleEditUser,
  handleEditModal
} from "./messages/register.js";


//  Ranking concept
// import { rankingConceptEmbed } from "./messages/rankingConcept.js";

//  Rankings
import { addRankEmbed } from "./messages/addRankMsgEmbed.js";

//  Clubs rankings
import {
  handleClubRankButton,
  handleClubSelection,
  handleClubResultModal,
  addClubsRankEmbed,
} from "./messages/addClubsRank.js";
import { handleRegisterClubs } from "./messages/registerClubs.js";
import { handleRegisterClubModal } from "./messages/registerClubs.js";

//  Match summary
import {
  addSummaryEmbed,
  handleSummaryButton,
  handleSummaryModal,
  handleSummarySelection,
} from "./messages/addSummary.js";

import { showAllSummaries } from "./messages/showAllSummeries.js";

// Player rank
import {
  handleRankButton,
  handleSelectPlayer,
  handleModalSubmit,
} from "./messages/addRank.js";

// Commands
import { showRankEmbed } from "./commands/showRank.js";
import { showUsers } from "./commands/showUsers.js";
import { userStatus } from "./commands/userStatus.js";
import { resetPlayersRank } from "./commands/resetPlayersRank.js";
import { delSummary } from "./commands/deleteSummary.js";
import { showClubRankEmbed } from "./commands/showClubRank.js";
import { sendMsg } from "./commands/sendMsg.js";
import { showClubs } from "./commands/showClubs.js";
import { clubInfo } from "./commands/clubInfo.js";
import { delClub } from "./commands/delClub.js";
import { editClubName } from "./commands/editClubName.js";

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

  // Player rank
  await addRankEmbed(client);

  // Clubs rank
  await addClubsRankEmbed(client);

  // Register player
  await sendRegisterMessage(client);

  // Rank concept
  // await rankingConceptEmbed(client);

  // Match summary
  await addSummaryEmbed(client);
});

client.on("messageCreate", async (msg) => {
  const channel = msg.channel;

  // const targetId = "1392481215205871618";

  if (msg.content.startsWith("$")) {
    const command = msg.content.slice(1).split(" ")[0];
    const args = msg.content.slice(command.length + 1).trim();

    // if (msg.author.id === targetId) {
    //   msg.reply(" Mizu so nub");
    // } 
    
    if (msg.author.id === "720430946200846377") {
      msg.reply("YES YES MY KING :crown:");
    } 
    
    if (msg.author.id === "709399362278785126") {
      msg.reply("YES W FLARE :crown:");
    }
      
    try {
      switch (command) {
        case "ping":
          msg.reply("Pong!");
          break;
        case "users":
          await showUsers(msg, args);
          break;
        case "userregstatus":
          userStatus(msg, args);
          break;
        case "sendmsg":
          await sendMsg(msg, client, args);
          break;
        case "resetrank":
          await resetPlayersRank(msg, args);
          break;
        case "clubs":
          showClubs(msg);
          break;
        case "clubinfo":
          clubInfo(msg, args, client);
          break;
        case "editclubname":
          editClubName(msg, args);
          break;
        case "delclub":
          await delClub(msg, args);
          break;
        case "delsummary":
          delSummary(msg, args);
          break;
        case "showrank":
          const limit = parseInt(args[0]) || 20;
          const result = await showRankEmbed(client, limit);
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
    await handleEditUser(interaction);
    await handleEditModal(interaction);

    if (hasAccess) {
      // Club
      await handleClubRankButton(interaction);
      await handleClubSelection(interaction);
      await handleClubResultModal(interaction);
      await handleRegisterClubs(interaction);
      await handleRegisterClubModal(interaction);

      // Player
      await handleRankButton(interaction, client);
      await handleSelectPlayer(interaction, client);
      await handleModalSubmit(interaction, client);

      // Summary
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
