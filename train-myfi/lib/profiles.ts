export const samplePersonas = [
  'college student',
  'young professional',
  'parent of two',
  'retiree',
  'entrepreneur',
  'international student'
];

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a 3-pile distribution for one habitude (9 cards total)
// Returns { thats_me: count, sometimes_me: count, not_me: count }
function generate3PileDistribution() {
  // Randomly split 9 cards into 3 piles
  const thatsMe = randomInt(2, 5);  // 2-5 cards in "that's me"
  const remaining = 9 - thatsMe;
  const sometimesMe = randomInt(Math.max(1, remaining - 5), Math.min(4, remaining - 1)); // ensure valid split
  const notMe = remaining - sometimesMe;
  
  return {
    thats_me: thatsMe,
    sometimes_me: sometimesMe,
    not_me: notMe
  };
}

export function generateRandomProfile() {
  const spontaneous = generate3PileDistribution();
  const status = generate3PileDistribution();
  const carefree = generate3PileDistribution();
  const planning = generate3PileDistribution();
  const giving = generate3PileDistribution();
  const security = generate3PileDistribution();
  
  const profile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    persona: samplePersonas[Math.floor(Math.random() * samplePersonas.length)],
    
    spontaneous_thats_me: spontaneous.thats_me,
    spontaneous_sometimes_me: spontaneous.sometimes_me,
    spontaneous_not_me: spontaneous.not_me,
    
    status_thats_me: status.thats_me,
    status_sometimes_me: status.sometimes_me,
    status_not_me: status.not_me,
    
    carefree_thats_me: carefree.thats_me,
    carefree_sometimes_me: carefree.sometimes_me,
    carefree_not_me: carefree.not_me,
    
    planning_thats_me: planning.thats_me,
    planning_sometimes_me: planning.sometimes_me,
    planning_not_me: planning.not_me,
    
    giving_thats_me: giving.thats_me,
    giving_sometimes_me: giving.sometimes_me,
    giving_not_me: giving.not_me,
    
    security_thats_me: security.thats_me,
    security_sometimes_me: security.sometimes_me,
    security_not_me: security.not_me,
  };
  return profile;
}
