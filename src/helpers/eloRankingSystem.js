/**
 * ELO Rating System
 * Formula:
 * newRating = oldRating + K * (score - expectedScore)
 *
 * - score: 1 = win, 0.5 = tie, 0 = lose
 * - expectedScore = 1 / (1 + 10^((opponent - player)/400))
 */

const K = 32; // K-factor (the magnitude of rating changes per match)

export function calculateElo(playerRating, opponentRating, score) {
  const expectedScore =
    1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const newRating = playerRating + K * (score - expectedScore);
  return Math.round(newRating);
}

/**
 * Match handler
 * Ex:
 *  - clubA win → scoreA = 1, scoreB = 0
 *  - seri → scoreA = scoreB = 0.5
 */
export function handleMatch(clubA, clubB, result) {
  let scoreA, scoreB;

  if (result === "A") {
    scoreA = 1;
    scoreB = 0;
  } else if (result === "B") {
    scoreA = 0;
    scoreB = 1;
  } else {
    scoreA = scoreB = 0.5;
  }

  const newA = calculateElo(clubA.rating, clubB.rating, scoreA);
  const newB = calculateElo(clubB.rating, clubA.rating, scoreB);

  return {
    [clubA.name]: newA,
    [clubB.name]: newB,
  };
}
