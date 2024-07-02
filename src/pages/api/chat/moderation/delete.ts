import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import { CHAT_PERMISSION } from '@/lib/constants.ts';
import connectToDatabase from "@/lib/mongodb.ts";
import Message from "@/models/Message.ts";
import {hasPermission} from "@/lib/utils.ts";
import {getSession, useSession} from "next-auth/react";
import Profile from "@/models/Profile.ts";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST")
        return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ error: 'Unauthorized' });

    const { messageId } = req.body;

    await connectToDatabase()

    const requestingUser = await Profile.findOne({ discordId: session.user.id });

    if (!requestingUser || !hasPermission(requestingUser, CHAT_PERMISSION.SEND_MESSAGE)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await Message.deleteOne({ _id: messageId })

    try {
        await pusher.trigger('presence-chat-channel', 'delete-message', { id: messageId });

        res.status(200).json({ message: 'Message deleted', result });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
}
