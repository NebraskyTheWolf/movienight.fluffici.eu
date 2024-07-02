import { NextApiRequest, NextApiResponse } from 'next';
import {GiphyFetch} from "@giphy/js-fetch-api";
import {USE_GIPHY} from "@/lib/constants.ts";
const giphyFetch = new GiphyFetch(process.env.GIPHY_TOKEN!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET")
        return res.status(405).json({ error: 'Method Not Allowed' });

    const {offset, limit} = req.query;

    if (USE_GIPHY) {
        res.status(200).json(await giphyFetch.trending({ offset: Number(offset), limit: Number(limit) }))
    } else {
        res.status(200).json({ status: false, error: 'Giphy feature is disabled!' })
    }
}
