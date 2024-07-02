import { NextApiRequest, NextApiResponse } from 'next';
import ChatSettings, {IChatSettings} from '@/models/ChatSettings';
import connectToDatabase from "@/lib/mongodb.ts";
import {hasPermission} from "@/lib/utils.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ error: 'Unauthorized' });

    if (!hasPermission(session.profile, CHAT_PERMISSION.ADMINISTRATOR)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await connectToDatabase();

    if (req.method === 'GET') {
        try {
            const settings = await ChatSettings.findOne({ _id: '668348b752dc60219a0aa9fe' });
            res.status(200).json({ settings: settings });
        } catch (error) {
            console.log(error)
            res.status(400).json({ success: false });
        }
    } else if (req.method === 'POST') {
        const { settings } = req.body

        if (!settings) {
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }

        try {
            const handleSettings = await ChatSettings.findOneAndUpdate({ _id: '668348b752dc60219a0aa9fe' }, settings, {
                new: true,
                upsert: true,
            });

            res.status(200).json({ settings: handleSettings });
        } catch (error) {
            console.log(error)
            res.status(400).json({ success: false });
        }
    } else {
        res.status(405).json({ success: false });
    }
}
