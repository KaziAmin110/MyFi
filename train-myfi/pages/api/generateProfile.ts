import { NextApiRequest, NextApiResponse } from 'next';
import { generateRandomProfile } from '../../lib/profiles';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const profile = generateRandomProfile();
  res.status(200).json(profile);
}
