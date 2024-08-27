import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import {v4} from "uuid";
import Redis from "ioredis";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

const redis = new Redis(process.env.REDIS_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST")
        return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ error: 'Unauthorized' });

    const key = await redis.get("live-key");
    const { user } = session;

    if (!key)
        return res.status(404).json({ error: 'Stream not found' });
    if (!user)
        return res.status(400).json({ error: 'Content is required' });

    const alreadyJoined = await redis.exists(`stream:${key}/${user.id}`)

    if (alreadyJoined)
        return res.status(400).json({ error: 'User already joined' });

    const content = `${user.name} se připojil/a do chatu`;

    const message = {
        id: v4(),
        content,
        type: 'system',
    };

    redis.set(`stream:${key}/${user.id}`, 1)
    redis.expire(`stream:${key}/${user.id}`, 8600)

    try {
        await pusher.trigger('presence-chat-channel', 'new-message', message);
        res.status(200).json({ message: 'System message sent' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
