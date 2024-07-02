import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb.ts';
import Profile from "@/models/Profile.ts";
import { v4 } from 'uuid';
import {hasPermission} from "@/lib/utils.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST")
        return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ error: 'Unauthorized' });

    const requestingUser = await Profile.findOne({ discordId: session.user.id });

    if (!requestingUser || !hasPermission(requestingUser, CHAT_PERMISSION.PUBLISH_STREAM)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        await connectToDatabase();
        const profile = await Profile.findOne({ discordId: session.user.id });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const newKey = v4()

        await Profile.updateOne({ _id: profile._id }, {
            $set: {
                streamKey: newKey
            }
        })

        res.status(200).json({newKey});
    } catch (error) {
        console.error('Failed to fetch stream details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
