import { NextApiRequest, NextApiResponse } from 'next';
import { generateRandomProfile } from '../../lib/profiles';
import { generatePersonaBackstory } from '../../lib/genai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const profile = generateRandomProfile();
  
  // Generate backstory with name and age
  const backstoryData = await generatePersonaBackstory(profile);
  profile.persona_backstory = backstoryData.backstory;
  profile.name = backstoryData.name;
  profile.age = backstoryData.age;
  
  res.status(200).json(profile);
}
