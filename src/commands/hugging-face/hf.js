import { InferenceClient } from "@huggingface/inference";
import { myLogs } from "../../utils/myLogs.js";

export async function hf(msg, args) {
  if (!args) return msg.reply("Make a question!");

  const client = new InferenceClient(process.env.HF_API_KEY);

  try {
    const res = await client.chatCompletion({
      model: "deepseek-ai/DeepSeek-V3-0324",
      messages: [{ role: "user", content: args }],
    });

    const answer = res.choices?.[0]?.message?.content;
    if (!answer) {
      myLogs("❌ Hugging Face AI no answer: " + JSON.stringify(res));
      return msg.reply("AI can't answer rn :(");
    }

    msg.reply(answer);

  } catch (err) {
    myLogs("❌ Hugging Face AI error: " + err.toString());
    msg.reply("An error occured while generating text 😅");
  }
}