import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb.ts';
import Profile from "@/models/Profile.ts";
import {hasPermission} from "@/lib/utils.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import { getServerSession } from 'next-auth';
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ error: 'Unauthorized' });

    if (!hasPermission(session.profile, CHAT_PERMISSION.MODERATION_DASHBOARD)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        await connectToDatabase();

        try {
            const users = await Profile.find();
            res.status(200).json(users);
        } catch (error) {
            res.status(400).json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
