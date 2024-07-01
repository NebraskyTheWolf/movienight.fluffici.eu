import { NextApiRequest, NextApiResponse } from 'next';
import Message from '@/models/Message';
import connectToDatabase from "@/lib/mongodb.ts";
import Stream from "@/models/Stream.ts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await connectToDatabase();
    const stream = await Stream.findOne({});

    if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
    }

    try {
        const messages = await Message.find({ streamId: stream.streamId }).sort({ timestamp: 1 }).exec();

        res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving messages' });
    }
}
