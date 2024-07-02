import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import { CHAT_PERMISSION } from '@/lib/constants.ts';
import connectToDatabase from "@/lib/mongodb.ts";
import Message from "@/models/Message.ts";
import {hasPermission} from "@/lib/utils.ts";
import {getSession, useSession} from "next-auth/react";
import Profile from "@/models/Profile.ts";
import {addPermission, removePermission} from "@/lib/permission.ts";
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

    const { id, permissions } = req.body;

    const requestingUser = await Profile.findOne({ discordId: session.user.id });
    const targetUser = await Profile.findOne({ discordId: id });

    if (!targetUser) {
        return res.status(404).json({ status: false, error: 'User not found' });
    }

    if (!requestingUser || !hasPermission(requestingUser, CHAT_PERMISSION.ADMINISTRATOR)) {
        return res.status(403).json({ status: false, error: 'Forbidden' });
    } else if (targetUser.permissions > requestingUser.permissions) {
        return res.status(403).json({ status: false, error: 'This user has bigger authority than yours' });
    }

    await Profile.updateOne({ _id: targetUser._id }, {
        $set: {
            permissions: addPermission(targetUser.permissions, permissions)
        }
    })

    try {
        await pusher.trigger('presence-chat-channel', 'permission_changed', { id: targetUser.discordId, permissions });

        res.status(200).json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Error patching user' });
    }
}
