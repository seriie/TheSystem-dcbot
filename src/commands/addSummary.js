// src/commands/summary.js
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} from "discord.js";
import { supabase } from "../config/supabase.js";
import { myLogs } from "../utils/myLogs.js";
import dotenv from "dotenv";
import { nanoIdFormat } from "../utils/nanoid.js";
dotenv.config();

// temporary in-memory store per user
const userSelections = new Map();

// ----------------------------------------------------------------------------
// send main embed + button to channel (call this from startup)
// ----------------------------------------------------------------------------
export const addSummaryEmbed = async (client) => {
  const channelId = process.env.MATCH_SUMMARY_CHANNEL_ID;
  const channel = await client.channels.fetch(channelId).catch(() => null);

  if (!channel) {
    myLogs("❌ Match Summary channel not found!");
    return;
  }

  try {
    myLogs("🧹  Purging ALL messages in register channel...");
    let deleted;
    do {
      const fetched = await channel.messages.fetch({ limit: 100 });
      if (fetched.size === 0) break;
      deleted = await channel.bulkDelete(fetched, true);
      myLogs(`🗑️  Deleted ${deleted.size} messages...`);
      await new Promise((r) => setTimeout(r, 1500));
    } while (deleted.size > 0);
  } catch (err) {
    myLogs("⚠️  Failed to delete messages:", err);
  }

  const embed = new EmbedBuilder()
    .setColor("#00ff99")
    .setTitle("📝 Match Summary Panel")
    .setDescription(
      "Click **Add Match Summary** to submit match results between two clubs.\nSupports BO3 and FT3 match types."
    )
    .setFooter({ text: "Match Summary" })
    .setTimestamp();

  const btnAdd = new ButtonBuilder()
    .setCustomId("open_summary_ui")
    .setLabel("Add Match Summary 🏆")
    .setStyle(ButtonStyle.Primary);

  const btnShow = new ButtonBuilder()
    .setCustomId("show_all_summary")
    .setLabel("Show All Summaries 📄")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(btnAdd, btnShow);

  await channel.send({
    content: "**Match Summary Management** — choose an action below.",
    embeds: [embed],
    components: [row],
  });

  myLogs("✅ Match Summary panel posted.");
};

// ----------------------------------------------------------------------------
// Helper: fetch all clubs as select menu options
// ----------------------------------------------------------------------------
const getClubOptions = async () => {
  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("id,club_name")
    .order("club_name", { ascending: true });

  if (error || !clubs) return [];
  return clubs.slice(0, 25).map((c) => ({ label: c.club_name, value: c.id }));
};

// ----------------------------------------------------------------------------
// Handle button click: show ephemeral dropdown for clubs
// ----------------------------------------------------------------------------
export const handleSummaryButton = async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "open_summary_ui") return;

  // fetch clubs
  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("id,club_name")
    .order("club_name", { ascending: true });

  if (error || !clubs || clubs.length === 0) {
    await interaction.reply({
      content: "⚠️ No clubs registered yet.",
      ephemeral: true,
    });
    return;
  }

  const options = clubs.slice(0, 25).map((c) => ({
    label: c.club_name,
    value: c.id, // club id as string
  }));

  const selectA = new StringSelectMenuBuilder()
    .setCustomId("select_summary_club_a")
    .setPlaceholder("Select Club A")
    .addOptions(options);

  const selectB = new StringSelectMenuBuilder()
    .setCustomId("select_summary_club_b")
    .setPlaceholder("Select Club B")
    .addOptions(options);

  const rowA = new ActionRowBuilder().addComponents(selectA);
  const rowB = new ActionRowBuilder().addComponents(selectB);

  userSelections.set(interaction.user.id, {}); // initialize

  await interaction.reply({
    content: "Select Club A and Club B.",
    components: [rowA, rowB],
    ephemeral: true,
  });
};

// ----------------------------------------------------------------------------
// Handle club selection
// ----------------------------------------------------------------------------
export const handleSummarySelection = async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const uid = interaction.user.id;
  const sel = userSelections.get(uid) || {};

  if (interaction.customId === "select_summary_club_a")
    sel.clubA = interaction.values[0];
  else if (interaction.customId === "select_summary_club_b")
    sel.clubB = interaction.values[0];
  else if (interaction.customId === "select_summary_type")
    sel.gameType = interaction.values[0];
  else if (interaction.customId === "select_match_mode")
    sel.matchMode = interaction.values[0];
  else return;

  userSelections.set(uid, sel);

  // rebuild club dropdowns dengan defaultValues
  const clubOptions = await getClubOptions();
  const rowA = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_summary_club_a")
      .setPlaceholder("Select Club A")
      .addOptions(
        clubOptions.map((opt) => ({
          label: opt.label,
          value: opt.value,
          default: sel.clubA === opt.value,
        }))
      )
  );

  const rowB = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_summary_club_b")
      .setPlaceholder("Select Club B")
      .addOptions(
        clubOptions.map((opt) => ({
          label: opt.label,
          value: opt.value,
          default: sel.clubB === opt.value,
        }))
      )
  );

  if (!sel.clubB) {
    await interaction.update({
      content: "Pick the other club as well...",
      components: [rowA, rowB],
    });
    return;
  }

  // prevent same club
  if (sel.clubA === sel.clubB) {
    sel.clubB = undefined;
    userSelections.set(uid, sel);
    await interaction.update({
      content: "⚠️ You cannot pick the same club twice.",
      components: [rowA, rowB],
    });
    return;
  }

  if (!sel.gameType) {
    const typeSelect = new StringSelectMenuBuilder()
      .setCustomId("select_summary_type")
      .setPlaceholder("Select Game Type")
      .addOptions([
        { label: "BO3", value: "BO3" },
        { label: "FT3", value: "FT3" },
      ]);

    const rowType = new ActionRowBuilder().addComponents(typeSelect);

    await interaction.update({
      content: "Select game type...",
      components: [rowType],
    });
    return;
  }

  // after selecting game type, choose match mode
  if (!sel.matchMode) {
    const modeSelect = new StringSelectMenuBuilder()
      .setCustomId("select_match_mode")
      .setPlaceholder("Select Match Type")
      .addOptions([
        { label: "3v3", value: "3v3" },
        { label: "4v4", value: "4v4" },
        { label: "5v5", value: "5v5" },
      ]);

    const rowMode = new ActionRowBuilder().addComponents(modeSelect);

    await interaction.update({
      content: "Select match type (3v3 / 4v4 / 5v5)",
      components: [rowMode],
    });
    return;
  }

  const maxGames = sel.gameType === "BO3" ? 3 : 5;
  const modal = new ModalBuilder()
    .setCustomId(
      `match_summary_modal_${sel.clubA}_${sel.clubB}_${sel.gameType}`
    )
    .setTitle("Submit Match Scores");

  const modalRows = [];
  for (let i = 0; i < maxGames; i++) {
    const scoreInput = new TextInputBuilder()
      .setCustomId(`score_${i + 1}`)
      .setLabel(`Game ${i + 1} - Enter scores as A-B`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("0-0")
      .setRequired(true);

    modalRows.push(new ActionRowBuilder().addComponents(scoreInput));
  }

  modal.addComponents(...modalRows);
  await interaction.showModal(modal);
};

// ----------------------------------------------------------------------------
// Handle modal submit
// ----------------------------------------------------------------------------
export const handleSummaryModal = async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("match_summary_modal_")) return;
  const sel = userSelections.get(interaction.user.id) || {};
  
  const parts = interaction.customId.split("_");
  const clubAId = parts[3];
  const clubBId = parts[4];
  const gameType = parts[5];

  const scoresA = [];
  const scoresB = [];
  const maxGames = gameType === "BO3" ? 3 : 5;

  for (let i = 0; i < maxGames; i++) {
    const val = interaction.fields.getTextInputValue(`score_${i + 1}`);
    const [a, b] = val.split("-").map((x) => parseInt(x.trim(), 10) || 0);
    scoresA.push(a);
    scoresB.push(b);
  }
  const playedGames = scoresA
    .map((a, i) => ({ a, b: scoresB[i] }))
    .filter((g) => g.a || g.b);
  let winsA = 0,
    winsB = 0;
  playedGames.forEach((g) => {
    if (g.a > g.b) winsA++;
    else if (g.b > g.a) winsB++;
  });

  const { data: clubAData } = await supabase
    .from("clubs")
    .select("club_name")
    .eq("id", clubAId)
    .single();
  const { data: clubBData } = await supabase
    .from("clubs")
    .select("club_name")
    .eq("id", clubBId)
    .single();

  // build plain text summary
  const summaryText = `${winsA}:${winsB} win for ${
    winsA > winsB ? clubAData.club_name : clubBData.club_name
  }`;
  const summaryChannelId = process.env.MATCH_SUMMARY_LOG_CHANNEL_ID;
  const summaryChannel = await interaction.client.channels
    .fetch(summaryChannelId)
    .catch(() => null);

  if (summaryChannel) {
    let msgLines = [];
    msgLines.push(`# ${clubAData.club_name} Vs ${clubBData.club_name} #`);
    msgLines.push(`**Game Type: ${gameType}**\n`);
    msgLines.push(`**Game Format: ${sel.matchMode}**`)

    playedGames.forEach((g, i) => {
      const winner = g.a > g.b ? clubAData.club_name : clubBData.club_name;
      msgLines.push(`Game ${i + 1}:\n ${g.a}-${g.b} win for ${winner}\n`);
    });

    msgLines.push(
      `\nSummary: ${winsA}:${winsB} win for ${
        winsA > winsB ? clubAData.club_name : clubBData.club_name
      }`
    );
    msgLines.push(`Recorded by: **${interaction.user.username}**`);

    await summaryChannel.send(msgLines.join("\n"));
  }


  // save to DB
  const { error } = await supabase.from("match_summary").insert([
    {
      id: nanoIdFormat("MSID", 12),
      club_a_id: clubAId,
      club_b_id: clubBId,
      game_type: gameType,
      games: playedGames,
      summary: summaryText,
      ranker: `${interaction.user.username}`,
      game_format: sel.matchMode
    },
  ]);

  if (error) {
    myLogs("❌ Failed to save match summary:" + JSON.stringify(error, null, 2));
    await interaction.reply({
      content: "⚠️ Failed to save to DB.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: "✅ Match summary submitted!",
    ephemeral: true,
  });
};
