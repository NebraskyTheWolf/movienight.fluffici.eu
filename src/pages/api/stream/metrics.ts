import { NextApiRequest, NextApiResponse } from 'next';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const key = await redis.get("live-key");

    if (!key) {
        return res.status(400).json({ error: 'streamId is required' });
    }

    try {
        const metricsKey = `stream:${key}:metrics`;
        const metrics = await redis.get(metricsKey);

        if (!metrics) {
            return res.status(404).json({ error: 'Metrics not found' });
        }

        res.status(200).json(JSON.parse(metrics));
    } catch (error) {
        console.error('Failed to fetch stream metrics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
