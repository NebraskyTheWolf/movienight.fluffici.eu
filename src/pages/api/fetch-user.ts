import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb.ts';
import Profile from "@/models/Profile.ts";
import {getSession} from "next-auth/react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession({ req })

    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await connectToDatabase();
        const stream = await Profile.findOne({ discordId: session.user.id });

        if (!stream) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(stream);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
