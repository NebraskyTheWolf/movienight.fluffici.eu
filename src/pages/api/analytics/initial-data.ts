import {NextApiRequest, NextApiResponse} from "next";
import Redis from "ioredis";
import {getServerSession} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";
import {hasPermission} from "@/lib/utils.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";

const redis = new Redis(process.env.REDIS_URL!);

interface Data {
    viewers: number;
    bitrate: number;
    fps: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST")
        return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ error: 'Unauthorized' });
    if (!hasPermission(session.profile, CHAT_PERMISSION.ADMINISTRATOR)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

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
