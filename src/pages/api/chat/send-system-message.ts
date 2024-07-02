import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import {v4} from "uuid";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    const message = {
        id: v4(),
        content,
        type: 'system',
    };

    try {
        await pusher.trigger('presence-chat-channel', 'new-message', message);
        res.status(200).json({ message: 'System message sent' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
