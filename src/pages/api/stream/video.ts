import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const key = await redis.get("live-key");

    const filePath = path.resolve(`/app/media/live/${key}/index.m3u8`);
    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.status(404).json({ error: 'Stream not found' });
    }
}
