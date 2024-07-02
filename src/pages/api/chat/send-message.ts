import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import { CHAT_PERMISSION } from '@/lib/constants';
import {hasPermission} from "@/lib/utils.ts";
import connectToDatabase from "@/lib/mongodb.ts";
import Message from "@/models/Message.ts";
import Stream from "@/models/Stream.ts";
import {getServerSession, User} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

import { Message as CMessage } from '@/lib/types.ts'
import message from "@/models/Message.ts";
import EmbedMessage from "@/components/EmbedMessage.tsx";
import {IProfile} from "@/models/Profile.ts";
import ChatSettings from "@/models/ChatSettings.ts";

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

    await connectToDatabase();
    const stream = await Stream.findOne({});

    if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
    }

    const {content, type } = req.body;

    const { streamId } = stream
    const { user } = session!;

    if (content.length <= 0)
        return res.status(400).json({ status: false, message: 'You cannot send empty messages' })

    const profile = session.profile

    if (!profile || !hasPermission(profile, CHAT_PERMISSION.SEND_MESSAGE)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    await connectToDatabase();

    const { timestamp, reactions} = {
        timestamp: Date.now(),
        reactions: []
    }

    if (type !== "user" && type !== "gif") {
        return res.status(400).json({ error: 'Invalid message type' });
    }

    const chatSettings = await ChatSettings.findOne({ _id: '668348b752dc60219a0aa9fe' })

    let isContentBlacklisted = false;
    if (chatSettings) {
        if (!chatSettings.enableChat)
            return res.status(403).json({ error: 'The chat was disabled by a administrator' });

        chatSettings.autoModeration.blacklist.forEach(value => {
            if (content.includes(value))
                isContentBlacklisted = true
        })

        chatSettings.autoModeration.regexPatterns.forEach(pattern => {
            if (content.match(pattern))
                isContentBlacklisted = true
        })
    }

    if (isContentBlacklisted)
        return res.status(403).json({ error: 'Your message contains blacklisted words' });

    try {
        const newMessage = new Message({
            streamId,
            content,
            type,
            user,
            profile,
            timestamp,
            reactions,
        });

        const data = await newMessage.save();

        const id = data._id;

        await pusher.trigger('presence-chat-channel', 'new-message', {
            id,
            content,
            type,
            user,
            profile,
            timestamp,
            reactions,
        });

        res.status(200).json({ status: true, message: data._id });
    } catch (error) {
        console.error(error)
        res.status(500).json({ status: false, error: "Cannot send message" });
    }
}
