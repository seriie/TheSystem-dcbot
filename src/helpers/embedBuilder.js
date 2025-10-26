import { EmbedBuilder } from "discord.js";

/**
 * Helper for making discord embed with optional parameter
 * @param {string} [color="#5865F2"] - Embed color (default blue Discord)
 * @param {string} [title=""] - Embed title
 * @param {string} [description=""] - Embed description
 * @param {string} [image=null] - Path or image url
 * @param {string} [footer=""] - Footer text
 * @param {boolean} [timestamp=true] - Do you want to show timestamp
 * @returns {{ embeds: EmbedBuilder[], files?: { attachment: string, name: string }[] }}
 */
export const embedBuilder = (
  color = "#5865F2",
  title = "",
  description = "",
  image = null,
  footer = "",
  timestamp = true
) => {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description);

  if (image) {
    embed.setImage(`attachment://${image.split("/").pop()}`);
  }

  if (footer) {
    embed.setFooter({ text: footer });
  }

  if (timestamp) {
    embed.setTimestamp();
  }

  const result = { embeds: [embed] };

  if (image) {
    result.files = [
      {
        attachment: image,
        name: image.split("/").pop(),
      },
    ];
  }

  return result;
};