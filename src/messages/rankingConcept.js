import { EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
import { myLogs } from "../utils/myLogs.js";
dotenv.config();

export const rankingConceptEmbed = async (client) => {
  const channelId = process.env.RANKING_CONCEPT_CHANNEL_ID;
  const channel = await client.channels.fetch(channelId);

  if (!channel) {
    myLogs("❌  Ranking concept channel not found!")
    return;
  }

  try {
    myLogs("🧹  Purging ALL messages in register channel...");
    let deleted;
    do {
      const fetched = await channel.messages.fetch({ limit: 100 });
      if (fetched.size === 0) break;
      deleted = await channel.bulkDelete(fetched, true);
      myLogs(`🗑️  Deleted ${deleted.size} messages...`)
      await new Promise((r) => setTimeout(r, 1500));
    } while (deleted.size > 0);
  } catch (err) {
    myLogs("\n⚠️  Failed to delete messages:", err)
  }

  const embed = new EmbedBuilder()
    .setColor("#000000")
    .setTitle("🧠 Ranking Concept")
    .setDescription(
      `
𝗔𝘀𝗶𝗮 𝗥𝗮𝗻𝗸𝗶𝗻𝗴 𝗖𝗼𝗻𝗰𝗲𝗽𝘁
<#1430790441036414986>
You will be observed by our **official or trial ranker** during any scrim that’s happening. Your ranking will be affected based on your **performance**, which will be evaluated from **Offence, Defence, Vision, Style Mastery, and Playmaking.** (friendly match is not count)

<#1430790486649475193>
We’ll make a **voting system** for the **Top Style Ranking**. To join, you just need to **Main one style or more** and vote. Everyone can participate. After voting ends, we’ll process and post the results.

<#1430790535215317022>
We’ll review all scrim records from different **Asian clubs** and use that data to rank each club based on their performance.

The ranking will follow the **ELO system**, where each team’s points go up or down depending on the result of every match.

We’re using a **sensitivity (K-factor) of 32**, which is the standard value (common options are 16, 32, and 64).

Basically, when a team wins, **they gain 32 points**, and the losing team **loses 32 points** — meaning **the winning team takes 32 points** directly from their opponent.

<#1430793940117880893>
Your ratings from **Offence, Defence, Playmaking, Vision,and Style Mastery** will be given by our **official or trial rankers.**
Stats will be taken from **top players stat. These stats** will then be ranked and compared to determine the **Top Stat players in each category.**
        `
    )
    .setImage("attachment://rankingConcept-bg.png")
    .setTimestamp();

  await channel.send({
    content: "**Welcome to the Ranking Concept Channel!** 🌟",
    embeds: [embed],
    files: [
      {
        attachment: "./src/assets/rankingConcept-bg.png",
        name: "rankingConcept-bg.png",
      },
    ],
  });
  myLogs("✅  Ranking concept message sent successfully!")
};
