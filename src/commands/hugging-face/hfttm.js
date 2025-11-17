// src/commands/hftom.js
import { InferenceClient } from "@huggingface/inference";
import { myLogs } from "../../utils/myLogs.js";
import fs from "fs";

export async function hfttm(msg, prompt) {
  const client = new InferenceClient(process.env.HF_API_KEY);

  try {
    const result = await client.textToImage({
      model: "hf-inference",
      inputs: prompt,
      parameters: { width: 512, height: 512 },
    });

    // Save image for a while
    const filePath = "./tmp_output.png";
    fs.writeFileSync(filePath, Buffer.from(result));

    // Send to Discord
    await msg.channel.send({ files: [filePath] });
  } catch (err) {
    myLogs("❌ HF text-to-image error: " + err.toString());
    msg.reply("Failed to generate image 😅");
  }
}