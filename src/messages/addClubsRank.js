// src/commands/addClubsRank.js
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import dotenv from "dotenv";
import { myLogs } from "../utils/myLogs.js";
import { handleMatch } from "../helpers/eloRankingSystem.js";
import { supabase } from "../config/supabase.js";
import { upsertClubRanking } from "../helpers/upsertClubRankings.js";
import { embedBuilder } from "../helpers/embedBuilder.js";

dotenv.config();

// temporary in-memory store for selections per user (ephemeral)
const userSelections = new Map();

// ----------------------------------------------------------------------------
// send main embed + button to channel (call this from startup)
// ----------------------------------------------------------------------------
export const addClubsRankEmbed = async (client) => {
  const channelId = process.env.CLUB_RANK_CHANNEL_ID;
  const channel = await client.channels.fetch(channelId).catch((e) => null);

  if (!channel) {
    myLogs("❌  Club Rank channel not found!");
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

  const embed = embedBuilder(
    "#0099ff",
    "⚔️ Club Ranking Panel",
    "Click **Add Club Ranking** to submit a match result between two clubs. The ELO system (K=32) will be used to compute ratings. Inputs are recorded to the database.",
    null,
    "Club Rankings",
    true
  );

  const btnAdd = new ButtonBuilder()
    .setCustomId("open_add_club_rank_ui")
    .setLabel("Add Club Ranking 🏆")
    .setStyle(ButtonStyle.Primary);

  const btnRegister = new ButtonBuilder()
    .setCustomId("open_register_club_rank_ui")
    .setLabel("Register club 📜")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(btnAdd, btnRegister);

  await channel.send({
    content:
      "**Club Ranking Management** — use the button below to add match results.",
    ...embed,
    components: [row],
  });

  myLogs("✅ Club Ranking panel posted.");
};

// ----------------------------------------------------------------------------
// helper: fetch clubs from DB
// ----------------------------------------------------------------------------
async function fetchClubs() {
  const { data, error } = await supabase
    .from("clubs")
    .select("id,club_name")
    .order("club_name", { ascending: true });

  if (error) {
    myLogs("❌ Failed to fetch clubs:", error);
    return [];
  }
  return data;
}

// ----------------------------------------------------------------------------
// Handle button click: show ephemeral dropdowns
// ----------------------------------------------------------------------------
export const handleClubRankButton = async (interaction) => {
  myLogs("addclubsrank button loaded");
  if (!interaction.isButton()) return;
  if (interaction.customId !== "open_add_club_rank_ui") return;

  // load clubs
  const clubs = await fetchClubs();
  if (!clubs || clubs.length === 0) {
    await interaction.reply({
      content: "⚠️ No clubs registered yet.",
      ephemeral: true,
    });
    return;
  }

  // build options (max 25 options allowed)
  const options = clubs.slice(0, 25).map((c) => ({
    label: c.club_name,
    value: String(c.id),
  }));

  const selectA = new StringSelectMenuBuilder()
    .setCustomId("select_club_a")
    .setPlaceholder("Select Team A")
    .addOptions(options);

  const selectB = new StringSelectMenuBuilder()
    .setCustomId("select_club_b")
    .setPlaceholder("Select Team B")
    .addOptions(options);

  const rowA = new ActionRowBuilder().addComponents(selectA);
  const rowB = new ActionRowBuilder().addComponents(selectB);

  // initialize user's selection object

  try {
    myLogs("trying to show ui");
    userSelections.set(interaction.user.id, {});

    await interaction.reply({
      content: "Select Team A and Team B (you can select one then the other).",
      components: [rowA, rowB],
      ephemeral: true,
    });
  } catch (e) {
    myLogs("error:" + e);
  }
};

// ----------------------------------------------------------------------------
// Handle select menu picks. When both chosen, show modal for scores.
// ----------------------------------------------------------------------------
export const handleClubSelection = async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const uid = interaction.user.id;
  const sel = userSelections.get(uid) || {};

  if (interaction.customId === "select_club_a") {
    sel.clubA = interaction.values[0];
  } else if (interaction.customId === "select_club_b") {
    sel.clubB = interaction.values[0];
  } else return;

  userSelections.set(uid, sel);

  const clubs = await fetchClubs();
  const options = clubs.slice(0, 25).map((c) => ({
    label: c.club_name,
    value: String(c.id),
    default: String(c.id) === sel.clubA || String(c.id) === sel.clubB, // auto-highlight
  }));

  const selectA = new StringSelectMenuBuilder()
    .setCustomId("select_club_a")
    .setPlaceholder("Select Team A")
    .addOptions(
      clubs.map((c) => ({
        label: c.club_name,
        value: String(c.id),
        default: String(c.id) === sel.clubA,
      }))
    );

  const selectB = new StringSelectMenuBuilder()
    .setCustomId("select_club_b")
    .setPlaceholder("Select Team B")
    .addOptions(
      clubs.map((c) => ({
        label: c.club_name,
        value: String(c.id),
        default: String(c.id) === sel.clubB,
      }))
    );

  const rowA = new ActionRowBuilder().addComponents(selectA);
  const rowB = new ActionRowBuilder().addComponents(selectB);

  if (!(sel.clubA && sel.clubB)) {
    await interaction.update({
      content: "Pick the other team as well...",
      components: [rowA, rowB],
    });
    return;
  }

  if (sel.clubA === sel.clubB) {
    sel.clubB = undefined;
    userSelections.set(uid, sel);
    await interaction.update({
      content:
        "⚠️ You selected the same club for both teams — pick a different club for Team B.",
      components: [rowA, rowB],
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`club_result_modal_${sel.clubA}_${sel.clubB}`)
    .setTitle("Submit Match Result");

  const scoreAInput = new TextInputBuilder()
    .setCustomId("scoreA")
    .setLabel("Team A score (win count)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Example: 2")
    .setRequired(true);

  const scoreBInput = new TextInputBuilder()
    .setCustomId("scoreB")
    .setLabel("Team B score (win count)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Example: 1")
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(scoreAInput),
    new ActionRowBuilder().addComponents(scoreBInput)
  );

  await interaction.showModal(modal);
};

// ----------------------------------------------------------------------------
// Handle modal submit: compute ELO, insert rows to clubs_rankings, notify channel
// ----------------------------------------------------------------------------
export const handleClubResultModal = async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("club_result_modal_")) return;
  myLogs(`${interaction.user.id} trying to add club ranking`);

  // parse club ids from customId
  // format: club_result_modal_<clubAId>_<clubBId>
  const parts = interaction.customId.split("_");
  const clubAId = parts[3];
  const clubBId = parts[4];

  // get scores from modal
  const scoreAraw = interaction.fields.getTextInputValue("scoreA").trim();
  const scoreBraw = interaction.fields.getTextInputValue("scoreB").trim();

  const scoreA = parseInt(scoreAraw, 10);
  const scoreB = parseInt(scoreBraw, 10);

  if (
    Number.isNaN(scoreA) ||
    Number.isNaN(scoreB) ||
    scoreA < 0 ||
    scoreB < 0
  ) {
    await interaction.reply({
      content: "⚠️ Scores must be non-negative integers.",
      ephemeral: true,
    });
    return;
  }

  // determine result symbol for elo helper ('A', 'B', 'DRAW')
  let resultSymbol = "DRAW";
  if (scoreA > scoreB) resultSymbol = "A";
  else if (scoreB > scoreA) resultSymbol = "B";

  // fetch club names & latest elo (from clubs_rankings), default elo = 1000
  const clubArow = await supabase
    .from("clubs")
    .select("id,club_name")
    .eq("id", clubAId)
    .single();
  const clubBrow = await supabase
    .from("clubs")
    .select("id,club_name")
    .eq("id", clubBId)
    .single();

  console.log("clubAId:", clubAId, "result:", clubArow);

  if (clubArow.error || clubBrow.error) {
    myLogs(
      "❌ Failed to find club rows:" +
        JSON.stringify(clubArow.error, null, 2) ||
        JSON.stringify(clubBrow.error, null, 2)
    );
    await interaction.reply({
      content: "⚠️ Failed to read club data from DB.",
      ephemeral: true,
    });
    return;
  }

  const clubAName = clubArow.data.club_name;
  const clubBName = clubBrow.data.club_name;

  // fetch latest elo per club from clubs_rankings (order by match_date desc), fallback 1000
  async function getLatestElo(clubId) {
    const { data, error } = await supabase
      .from("club_rankings")
      .select("elo")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      myLogs("❌ Failed to fetch latest elo:" + JSON.stringify(error, null, 2));
      return 1000;
    }
    if (!data || data.length === 0) return 1000;
    return data[0].elo ?? 1000;
  }

  const eloA_before = await getLatestElo(clubAId);
  const eloB_before = await getLatestElo(clubBId);

  // use your elo helper: requires objects with .rating property
  const clubAobj = { name: clubAName, rating: eloA_before };
  const clubBobj = { name: clubBName, rating: eloB_before };

  const updated = handleMatch(clubAobj, clubBobj, resultSymbol);
  const eloA_after = updated[clubAName];
  const eloB_after = updated[clubBName];

  await upsertClubRanking(clubAId, scoreA, scoreB, eloA_after);
  await upsertClubRanking(clubBId, scoreB, scoreA, eloB_after);

  myLogs(
    `✅ Saved match: ${clubAName} ${scoreA} - ${scoreB} ${clubBName} -> ELO ${eloA_after}/${eloB_after}`
  );

  // public announce in the club rank channel
  const announceChannelId = process.env.CLUB_RANK_CHANNEL_ID;
  const announceChannel = await interaction.client.channels
    .fetch(announceChannelId)
    .catch(() => null);

  if (announceChannel) {
    await announceChannel.send({
      content: "**New match recorded!**",
    });
  }

  // reply to user (ephemeral confirmation)
  await interaction.reply({
    content: "✅ Match recorded and saved to database.",
    ephemeral: true,
  });
};
