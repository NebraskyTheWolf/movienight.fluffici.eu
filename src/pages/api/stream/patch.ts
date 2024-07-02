import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb.ts';
import Stream from '@/models/Stream.ts';
import path from 'path';
import Profile from "@/models/Profile.ts";
import { v4 } from 'uuid';
import {getSession} from "next-auth/react";
import {hasPermission} from "@/lib/utils.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import {decodeFromBase64} from "next/dist/build/webpack/loaders/utils";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

export interface ContentRating {
    age: number;
    reason: string;
}

export interface Data {
    title: string,
    contentRating: ContentRating
}

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

    const data: Data = req.body

    if (!data) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        await connectToDatabase();

        const result = await Stream.updateOne({ _id: '667fcb22f7db520f8079faf2' }, {
            $set: {
                title: data.title,
                contentRating: {
                    age: data.contentRating.age,
                    reason: data.contentRating.reason
                }
            }
        })

        res.status(200).json({ result });
    } catch (error) {
        console.error('Failed to fetch stream details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
