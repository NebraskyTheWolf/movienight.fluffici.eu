import { NextApiRequest, NextApiResponse } from 'next';
import ChatSettings, {IChatSettings} from '@/models/ChatSettings';
import connectToDatabase from "@/lib/mongodb.ts";
import {decodeFromBase64, encodeToBase64} from "next/dist/build/webpack/loaders/utils";
import {getSession} from "next-auth/react";
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
            const { q } = req.query;

            if (q) {
                const decoded = decodeFromBase64<string>(<string>q)

                const settings = await ChatSettings.findOneAndUpdate({ _id: '668348b752dc60219a0aa9fe' }, JSON.parse(JSON.stringify(decoded)), {
                    new: true,
                    upsert: true,
                });
                res.status(200).json(settings);
            } else {
                const settings = await ChatSettings.findOne({});
                const encoded = encodeToBase64(settings!);
                res.status(200).json({ settings: encoded });
            }
        } catch (error) {
            console.log(error)
            res.status(400).json({ success: false });
        }
    } else {
        res.status(405).json({ success: false });
    }
}
