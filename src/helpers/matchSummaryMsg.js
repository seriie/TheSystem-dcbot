// src/helpers/matchSummaryMsg.js
export function matchSummaryMsg({
  index = 0,
  clubA,
  clubB,
  gameType,
  gameFormat,
  games,
  summary,
  ranker,
  summaryId,
}) {
  let textMsg = `# Match #${index + 1} #\n\n`;
  textMsg += `# ${clubA} vs ${clubB} #\n`;
  textMsg += `## Game Type: ${gameType} ##\n`;
  textMsg += `**Game Format: ${gameFormat}**\n\n`;

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const winner = g.a > g.b ? clubA : clubB;
    textMsg += `Game ${i + 1}: ${g.a}-${g.b} win for ${winner}\n\n`;
  }

  textMsg += `Summary: **${summary}**\n`;
  textMsg += `Recorded by: **${ranker}**\n`;
  textMsg += `-# Summary ID: **${summaryId}**`;

  return textMsg;
}