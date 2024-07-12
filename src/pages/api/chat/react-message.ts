import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import {CHAT_PERMISSION} from '@/lib/constants';
import {hasPermission} from "@/lib/utils.ts";
import connectToDatabase from "@/lib/mongodb.ts";
import Stream from "@/models/Stream.ts";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";
import Message from "@/models/Message.ts";

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
    const { message } = req.body

    const profile = session.profile

    if (!profile || !hasPermission(profile, CHAT_PERMISSION.MESSAGE_REACTION)) {
        return res.status(403).json({ status: false, error: 'Forbidden' });
    }

    try {
        await Message.findOneAndUpdate({ _id: message._id }, { $set: {
            reactions: message.reactions
        }})

        await pusher.trigger("presence-chat-channel", "message-reaction", { id: message._id, reactions: message.reactions })

        res.status(200).json({ status: true });
    } catch (error) {
        console.error(error)
        res.status(500).json({ status: false, error: "Cannot send message" });
    }
}
