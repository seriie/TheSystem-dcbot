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
        Asia Ranking, Ranking concept
⁠⬩<#1430790441036414986>
You will be observe by any of our staff if any of them in the scrim that's happening and will impact your ranking depending on your performance or you can send an ss of the scrim stat to one of our staff and we might consider it (friendly didnt count)

⁠⬩<#1430790486649475193>
We will create a voting system for the top style ranking and to enter you have to play 1 style and vote and everyone can participate then we will process all the votes and then post the voting results

⁠⬩<#1430790535215317022>
We will review every scrim record of every server in asia that we know and will procces it and rank the club one by one from the scrim record

⁠⬩<#1430793940117880893>
We will make a rating system from Shooting, Passing, Blocking, Playmaking, and Style mastery. you will be rating for all other people and we will procces it and post the results

  We are ready to clear any queries you have!
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
