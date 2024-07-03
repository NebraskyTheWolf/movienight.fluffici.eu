import { authOptions } from "../auth/[...nextauth]"

import {NextApiRequest, NextApiResponse} from "next";
import pusherServer from "@/lib/pusherServer.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import {hasPermission} from "@/lib/utils.ts";
import {getServerSession} from "next-auth";

/**
 * Handles the request to authorize a user's presence in a chat channel.
 *
 * @param {NextApiRequest} req - The Next.js API request object.
 * @param {NextApiResponse} res - The Next.js API response object.
 * @return {Promise<void>} - A promise that resolves with the authorized response.
 *
 * @throws {Error} - If there is an error while authorizing the user's presence.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== "POST")
        return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);

    if (!session)
        return res.status(401).json({ error: 'Not authenticated' });
    if (!hasPermission(session.profile, CHAT_PERMISSION.JOIN_PRESENCE))
        return res.status(403).json({ error: 'Insufficient permissions' });

    const { socket_id, channel_name } = req.body;
    const presenceData = {
        user_id: session.user.id,
        user_info: {
            ...session.user
        }
    };

    try {
        const auth = pusherServer.authorizeChannel(socket_id, channel_name, presenceData);
        res.status(200).send(auth);
    } catch (error) {
        console.error(error)
        res.status(500).json({ status: false, error: 'Internal Server Error' })
    }
};
