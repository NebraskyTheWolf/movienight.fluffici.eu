import { NextApiRequest, NextApiResponse } from 'next';
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const response = await axios.get(`https://discord.com/api/v9/users/${req.query.discordId}`, {
            headers: {
                'Authorization': `Bot ${process.env.BOT_TOKEN}`
            }
        })

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
