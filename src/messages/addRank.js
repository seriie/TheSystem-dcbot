import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { getUnrankedUsers } from "../db/getUnrankedUsers.js";

import dotenv from "dotenv";
dotenv.config();

export const addRankEmbed = async (client) => {
  const channelId = process.env.RANK_CHANNEL_ID;
  const channel = await client.channels.fetch(channelId);

  if (!channel) {
    console.error("\n[❌]   Rank channel not found!");
    return;
  }

  try {
    console.log("\n[🧹]   Purging ALL messages in register channel...");
    let deleted;
    do {
      const fetched = await channel.messages.fetch({ limit: 100 });
      if (fetched.size === 0) break;
      deleted = await channel.bulkDelete(fetched, true);
      console.log(`\n[🗑️]   Deleted ${deleted.size} messages...`);
      await new Promise((r) => setTimeout(r, 1500));
    } while (deleted.size > 0);
  } catch (err) {
    console.error("\n[⚠️]   Failed to delete messages:", err);
  }

  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("🏆Add New Rank")
    .setDescription(
      "Click the button below to add a new rank to the ranking system.\n\n" +
        "Make sure to provide accurate information when prompted!"
    )
    .setImage("attachment://set-rank-bg.png")
    .setFooter({ text: "Press the button!" })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId("add_rank")
    .setLabel("Add Rank 🏅")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  await channel.send({
    content: "**Add a New Rank For Players to the Ranking System!** 🏆",
    embeds: [embed],
    components: [row],
    files: [
     {
      attachment: './src/assets/set-rank-bg.png',
      name: 'set-rank-bg.png'
     }
    ],
  });
  console.log("\n[✅]   Add Rank message sent!");
};

export const handleRankButton = async (interaction) => {
  if (!interaction.isButton()) return;

  const users = await getUnrankedUsers(25);
  if (!users.length) {
    return interaction.reply({
      content: "✅ No unranked players found.",
      ephemeral: true,
    });
  }

  const options = users.map((u) => ({
    label: u.discord_username.slice(0, 100),
    value: u.discord_username, // we'll use discord_username as identifier
  }));

  // select menu to pick player
  const select = new StringSelectMenuBuilder()
    .setCustomId("select_player_to_rank")
    .setPlaceholder("Select a player to rank")
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(select);

  // optionally add cancel button
  const cancel = new ButtonBuilder()
    .setCustomId("cancel_ranking_flow")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Danger);

  const row2 = new ActionRowBuilder().addComponents(cancel);

  await interaction.reply({
    content: "Choose a player to rank (only players not yet ranked are shown).",
    components: [row, row2],
    ephemeral: true, // or false if you want visible in channel
  });
};
