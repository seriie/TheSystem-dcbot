// haloGpt.js
import OpenAI from "openai";
import dotenv from "dotenv";
import { myLogs } from "../utils/myLogs.js";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// For saving all session
const sessions = {};

export const halo = async (msg, args) => {
  const userId = msg.author.id;

  // If no session, create new
  if (!sessions[userId]) {
    sessions[userId] = [];
  }

  // Input user message
  if (args && args.length > 0) {
    sessions[userId].push({
      role: "user",
      content: args,
    });
  } else {
    // IF "$halo" without asking
    sessions[userId].push({
      role: "user",
      content: "Hai!",
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: sessions[userId],
      max_tokens: 150,
    });

    const reply = completion.choices[0].message.content;

    // Save answer to history
    sessions[userId].push({
      role: "assistant",
      content: reply,
    });

    msg.reply(reply);
  } catch (err) {
    myLogs(`❌ ${err}`);
    msg.reply("⚠️ An error occured~");
  }
};

// Forward chat if user replied
export const continueChat = async (msg) => {
  const userId = msg.author.id;

  // Just forwarding if user has a session
  if (!sessions[userId]) return;

  sessions[userId].push({
    role: "user",
    content: msg.content,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: sessions[userId],
      max_tokens: 150,
    });

    const reply = completion.choices[0].message.content;

    sessions[userId].push({
      role: "assistant",
      content: reply,
    });

    msg.reply(reply);
  } catch (err) {
    console.error(err);
    msg.reply("⚠️ Error continuing chat...");
  }
};