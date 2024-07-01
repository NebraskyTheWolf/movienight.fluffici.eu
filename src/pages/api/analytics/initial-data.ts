import {NextApiRequest, NextApiResponse} from "next";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

interface Data {
    viewers: number;
    bitrate: number;
    fps: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const key = await redis.get("live-key");

    if (!key) {
        return res.status(404).json({ error: "Key not found" });
    }

    // @ts-ignore
    const data: Data = JSON.parse(await redis.get(`stream:${key}:metrics`))

    if (!data) {
        return res.status(404).json({ error: "Data not found" });
    }

    const initialData = {
        chartData: {
            labels: [],
            datasets: [
                {
                    label: 'Viewers',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                },
            ],
        },
        metrics: {
            totalViewers: data.viewers
        },
    };
    res.json(initialData);
}
