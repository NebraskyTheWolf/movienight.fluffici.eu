import { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import connectToDatabase from "@/lib/mongodb.ts";
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
