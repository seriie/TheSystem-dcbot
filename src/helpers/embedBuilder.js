import { EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";

/**
 * Helper for making discord embed with optional parameter and fallback image
 * @param {string} [color="#5865F2"]
 * @param {string} [title=""]
 * @param {string} [description=""]
 * @param {string|null} [image=null] - Optional. If not provided, uses default banner.
 * @param {string} [footer=""]
 * @param {boolean} [timestamp=true]
 */
export const embedBuilder = (
  color = "#5865F2",
  title = "",
  description = "",
  image = null,
  footer = "",
  timestamp = true
) => {
  const defaultBanner = path.resolve("./src/assets/basic-pan-ranking-banner.png");

  const useImage =
    image && fs.existsSync(image) ? image : (fs.existsSync(defaultBanner) ? defaultBanner : null);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description);

  if (useImage) {
    embed.setImage(`attachment://${path.basename(useImage)}`);
  }

  if (footer) embed.setFooter({ text: footer });
  if (timestamp) embed.setTimestamp();

  const result = { embeds: [embed] };

  if (useImage) {
    result.files = [
      {
        attachment: useImage,
        name: path.basename(useImage),
      },
    ];
  }

  return result;
};