import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";

const redis = new Redis(process.env.REDIS_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const key = await redis.get("live-key");

        if (!key) {
            console.error("Live key not found in Redis");
            return res.status(404).json({ error: 'Stream not found' });
        }

        const filePath = path.resolve(`/app/media/live/${key}/${req.query.filename}`);

        console.log(`Checking for file at path: ${filePath}`);

        if (fs.existsSync(filePath)) {
            if (filePath.endsWith('.m3u8')) {
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            } else if (filePath.endsWith('.ts')) {
                res.setHeader('Content-Type', 'video/MP2T');
            }
            fs.createReadStream(filePath).pipe(res);
        } else {
            console.error(`File not found at path: ${filePath}`);
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('Error while serving the stream:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
