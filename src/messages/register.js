import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { nanoIdFormat } from "../utils/nanoid.js";
import { supabase } from "../config/supabase.js";

import dotenv from "dotenv";
dotenv.config();

// === SEND REGISTER MESSAGE ===
export const sendRegisterMessage = async (client) => {
  const channelId = process.env.REGISTER_CHANNEL_ID;
  const channel = await client.channels.fetch(channelId);

  if (!channel) {
    console.error("[❌] Register channel not found!");
    return;
  }

  try {
    console.log("[🧹] Purging ALL messages in register channel...");
    let deleted;
    do {
      const fetched = await channel.messages.fetch({ limit: 100 });
      if (fetched.size === 0) break;
      deleted = await channel.bulkDelete(fetched, true);
      console.log(`[🗑️] Deleted ${deleted.size} messages...`);
      await new Promise((r) => setTimeout(r, 1500));
    } while (deleted.size > 0);
  } catch (err) {
    console.error("[⚠️] Failed to delete messages:", err);
  }

  const embed = new EmbedBuilder()
    .setColor("#ffffff")
    .setTitle("🧠 Member Registration")
    .setDescription(
      "Welcome to the server! Click the button below to register as a player.\n\n" +
        "Once registered, you’ll be added to the ranking list and gain access to ranking features!"
    )
    .setImage("attachment://register-bg.png")
    .setFooter({ text: "Press the button only once!" })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId("register_user")
    .setLabel("Register Now 🚀")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);

  await channel.send({
    content: "**Welcome to the Registration Channel!** 🌟",
    embeds: [embed],
    components: [row],
    files: [
    {
      attachment: "./src/assets/register-bg.png",
      name: "register-bg.png",
    },
  ],
  });
  console.log("[✅] Register message sent successfully!");
};

// === HANDLE BUTTON CLICK ===
export const handleRegisterButton = async (interaction) => {
  if (!interaction.isButton() || interaction.customId !== "register_user")
    return;
  console.log(`[📝] ${interaction.user.username} is trying to register...`);

  const userId = interaction.user.id;
  const username = interaction.user.username;

  // Check existing user
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("discord_id", userId)
    .single();

  if (existingUser) {
    return interaction.reply({
      content: `❗ You are already registered, ${username}!`,
      ephemeral: true,
    });
  }

  // Create modal for Roblox username
  const modal = new ModalBuilder()
    .setCustomId("register_modal")
    .setTitle("👤 Player Registration");

  const robloxInput = new TextInputBuilder()
    .setCustomId("roblox_username")
    .setLabel("Enter your Roblox username(not display name)")
    .setPlaceholder("Example: CoolPlayer_123")
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  const row = new ActionRowBuilder().addComponents(robloxInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
};

// === HANDLE MODAL SUBMIT ===
export const handleRegisterModal = async (interaction) => {
  console.log("[🔄] Handling register modal submission...");
  if (!interaction.isModalSubmit() || interaction.customId !== "register_modal")
    return;

  const userId = interaction.user.id;
  const username = interaction.user.username;
  const account_created_at = interaction.user.createdAt;
  const robloxUsername =
    interaction.fields.getTextInputValue("roblox_username");

  const userData = {
    id: nanoIdFormat("USR", 10),
    discord_id: userId,
    discord_username: username,
    roblox_username: robloxUsername,
    joined_at: new Date().toISOString(),
    account_created_at: account_created_at.toISOString(),
  };

  const { error } = await supabase.from("users").insert(userData);

  if (error) {
    console.error("[❌] Failed to insert user:", error);
    return interaction.reply({
      content: "⚠️ Failed to register. Please try again later.",
      ephemeral: true,
    });
  }

  console.log(`[✅] ${interaction.user.username} have been registered!`)
  await interaction.reply({
    content: `✅ Successfully registered, **${username}**!\nYour Roblox username: **${robloxUsername}** 🎮`,
    ephemeral: true,
  });
};