import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import { CHAT_PERMISSION } from '@/lib/constants.ts';
import connectToDatabase from "@/lib/mongodb.ts";
import {hasPermission} from "@/lib/utils.ts";
import Profile from "@/models/Profile.ts";
import {v4} from "uuid";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});


/**
 * Handler function to mute a user.
 *
 * @param {import("next").NextApiRequest} req - The request object.
 * @param {import("next").NextApiResponse} res - The response object.
 *
 * @returns {Promise<void>} - A Promise that resolves when the function is completed.
 *
 * @throws {Error} - If there is an error muting the user.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== "POST")
        return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ error: 'Unauthorized' });

    await connectToDatabase();

    const { userId, reason } = req.body;

    const requestingUser = await Profile.findOne({ discordId: session.user.id });
    const targetUser = await Profile.findOne({ discordId: userId});

    if (!requestingUser || !hasPermission(requestingUser, CHAT_PERMISSION.MUTE_USER)) {
        return res.status(403).json({ status: false, error: 'Forbidden' });
    } else if (!targetUser || hasPermission(targetUser, CHAT_PERMISSION.ADMINISTRATOR)) {
        return res.status(403).json({ status: false, error: 'Cannot ban a administrator' });
    } else if (targetUser.permissions > requestingUser.permissions) {
        return res.status(403).json({ status: false, error: 'This user has bigger authority than yours' });
    }

    await Profile.updateOne({ _id: targetUser._id }, {
        $set: {
            permissions: 0,
            sanction: {
                ban: {
                    issuer: session.user.name,
                    reason: reason
                }
            }
        }
    })

    try {
        await pusher.trigger('presence-chat-channel', 'user-banned', { id: targetUser.discordId });
        await pusher.trigger('presence-chat-channel', 'new-message', {
            id: v4(),
            content: `@${session.user.name} banned ${targetUser.id} reason ${reason}`,
            type: 'system',
        });

        res.status(200).json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Error muting user' });
    }
}
