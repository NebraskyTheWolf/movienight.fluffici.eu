import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import { CHAT_PERMISSION } from '@/lib/constants';
import {hasPermission} from "@/lib/utils.ts";
import connectToDatabase from "@/lib/mongodb.ts";
import Message from "@/models/Message.ts";
import Stream from "@/models/Stream.ts";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

import EmbedMessage from "@/components/EmbedMessage.tsx";
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
        return res.status(405).json({ status: false, error: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ status: false, error: 'Unauthorized' });

    await connectToDatabase();
    const stream = await Stream.findOne({});

    if (!stream) {
        return res.status(404).json({ status: false, error: 'Stream not found' });
    }

    const {content, messageId } = req.body;

    if (content instanceof EmbedMessage) {
        return res.status(400).json({ status: false, error: 'Invalid message content' });
    }

    const { streamId } = stream
    const { user } = session!;

    if (content.length <= 0)
        return res.status(400).json({ status: false, error: 'You cannot send empty messages' })

    const profile = session.profile

    if (!profile || !hasPermission(profile, CHAT_PERMISSION.REPLY_MESSAGE)) {
        return res.status(403).json({ status: false, error: 'Forbidden' });
    }

    const { timestamp, reactions} = {
        timestamp: Date.now(),
        reactions: []
    }

    const repliedMessage = await Message.findOne({ _id: messageId })
    const chatSettings = await ChatSettings.findOne({ _id: '668348b752dc60219a0aa9fe' })

    let isContentBlacklisted = false;
    if (chatSettings) {
        if (!chatSettings.enableChat)
            return res.status(403).json({ status: false, error: 'The chat was disabled by a administrator' });

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
        return res.status(403).json({ status: false, error: 'Your message contains blacklisted words' });

    const type = 'reply'

    try {
        const newMessage = new Message({
            streamId,
            content,
            type,
            user,
            profile,
            timestamp,
            reactions,
            repliedMessage
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
            repliedMessage
        });

        res.status(200).json({ status: true, message: data._id });
    } catch (error) {
        console.error(error)
        res.status(500).json({ status: false, error: "Cannot reply message" });
    }
}
