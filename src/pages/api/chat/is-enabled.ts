import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import { CHAT_PERMISSION } from '@/lib/constants';
import connectToDatabase from "@/lib/mongodb.ts";
import Message from "@/models/Message.ts";
import {hasPermission} from "@/lib/utils.ts";
import {getSession, useSession} from "next-auth/react";
import Profile from "@/models/Profile.ts";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";
import ChatSettings from "@/models/ChatSettings.ts";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET")
        return res.status(405).json({ error: 'Method Not Allowed' });

    await connectToDatabase()
    const settings = await ChatSettings.findOne({ _id: '668348b752dc60219a0aa9fe' });

    if (!settings) {
        return res.status(200).json({ enabled: false });
    }

    try {
        return res.status(200).json({ enabled: settings.enableChat });
    } catch (error) {
        res.status(500).json({ status: false, error: 'Error deleting message' });
    }
}
