import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import { CHAT_PERMISSION } from '@/lib/constants.ts';
import connectToDatabase from "@/lib/mongodb.ts";
import Message from "@/models/Message.ts";
import {hasPermission} from "@/lib/utils.ts";
import {getSession, useSession} from "next-auth/react";
import Profile from "@/models/Profile.ts";
import {removePermission} from "@/lib/permission.ts";

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
    await connectToDatabase();

    const { userId } = req.query;
    const session = await getSession({ req })

    if (!session) {
        return res.status(401).json({ status: false, error: 'Unauthorized' });
    }

    const requestingUser = await Profile.findOne({ discordId: session.user.id });
    const targetUser = await Profile.findOne({ discordId: userId});

    if (!requestingUser || !hasPermission(requestingUser, CHAT_PERMISSION.MUTE_USER)) {
        return res.status(403).json({ status: false, error: 'Forbidden' });
    } else if (!targetUser || hasPermission(targetUser, CHAT_PERMISSION.ADMINISTRATOR)) {
        return res.status(403).json({ status: false, error: 'Cannot mute a administrator' });
    } else if (targetUser.permissions > requestingUser.permissions) {
        return res.status(403).json({ status: false, error: 'This user has bigger authority than yours' });
    }

    // Recalculating the permissions bits
    let permissions = targetUser.permissions
    permissions = removePermission(permissions, CHAT_PERMISSION.SEND_MESSAGE)
    permissions = removePermission(permissions, CHAT_PERMISSION.SEND_EMOJIS)
    permissions = removePermission(permissions, CHAT_PERMISSION.REPLY_MESSAGE)
    permissions = removePermission(permissions, CHAT_PERMISSION.MESSAGE_REACTION)
    permissions = removePermission(permissions, CHAT_PERMISSION.READ_MESSAGE_HISTORY)

    await Profile.updateOne({ _id: targetUser._id }, {
        $set: {
            permissions: permissions
        }
    })

    try {
        await pusher.trigger('chat-channel', 'user-muted', { id: targetUser.discordId });

        res.status(200).json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Error muting user' });
    }
}
