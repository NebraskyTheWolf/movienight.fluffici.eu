import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb.ts';
import Stream from '@/models/Stream.ts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        await connectToDatabase();
        const stream = await Stream.findOne({});

        if (!stream) {
            return res.status(404).json({ error: 'Stream not found' });
        }

        res.status(200).json(stream);
    } catch (error) {
        console.error('Failed to fetch stream details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
