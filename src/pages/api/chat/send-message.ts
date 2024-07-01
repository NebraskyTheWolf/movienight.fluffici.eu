import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import { CHAT_PERMISSION } from '@/lib/constants';
import {hasPermission} from "@/lib/utils.ts";
import connectToDatabase from "@/lib/mongodb.ts";
import Message from "@/models/Message.ts";
import {getSession} from "next-auth/react";
import Profile from "@/models/Profile.ts";
import Stream from "@/models/Stream.ts";
import {decodeFromBase64} from "next/dist/build/webpack/loaders/utils";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession({ req })

    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    await connectToDatabase();
    const stream = await Stream.findOne({});

    if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
    }

    const content = <string>req.query.content;
    const { streamId } = stream
    const { user } = session!;

    if (content.length <= 0)
        return res.status(400).json({ status: false, message: 'You cannot send empty messages' })

    const profile = session.profile

    if (!profile || !hasPermission(profile, CHAT_PERMISSION.SEND_MESSAGE)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { type, timestamp, reactions} = {
        type: 'user',
        timestamp: Date.now(),
        reactions: []
    }

    try {
        await connectToDatabase();

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

        await pusher.trigger('chat-channel', 'new-message', {
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
