import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import connectToDatabase from "@/lib/mongodb.ts";
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
    if (req.method !== "GET")
        return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ error: 'Unauthorized' });

    await connectToDatabase()

    const requestingUser = await Profile.findOne({ discordId: session.user.id });
    if (!requestingUser)
        return res.status(403).json({ error: 'User is not authorized' });

    try {
        if (requestingUser.permissions == 0) {
            const ban = requestingUser.sanction.ban;

            await pusher.trigger('presence-chat-channel', 'banned-user', { id: requestingUser.discordId });

            return res.status(200).json({ status: true, ban });
        }

        return res.status(200).json({ status: false });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting message' });
    }
}
