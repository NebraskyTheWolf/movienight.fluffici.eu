import {SYSTEM_MESSAGE_TYPE} from '@/lib/constants';
import {NextApiRequest, NextApiResponse} from 'next';
import Pusher from 'pusher';
import Message from "@/models/Message.ts";
import connectToDatabase from "@/lib/mongodb.ts";
import Stream from "@/models/Stream.ts";
import {User} from "next-auth";
import {EmbedMessage} from "@/lib/types.ts";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' });

    const { target, systemType } = req.body;
    if (!target)
        return res.status(400).json({ error: 'Target is required' });
    if (!systemType || !Object.values(SYSTEM_MESSAGE_TYPE).includes(systemType))
        return res.status(400).json({ error: 'Invalid or missing system type' });

    await connectToDatabase();
    const stream = await Stream.findOne({});
    if (!stream)
        return res.status(404).json({ status: false, error: 'Stream not found' });

    const {streamId, type, user, profile, timestamp, reactions, embeds} = {
        streamId: stream.streamId,
        type: 'bot',
        user: {
            id: '1090193884782526525',
            name: 'FluffBOT',
            image: 'https://cdn.discordapp.com/app-icons/1090193884782526525/1aed19e69224aeb09df782a3285e5e6a.png',
            email: 'fluffbot@fluffici.eu'
        },
        profile: {
            discordId: '1090193884782526525',
            permissions: 0,
            streamKey: 'null',
            flags: 32,
            sanction: {}
        },
        timestamp: Date.now(),
        reactions: [
            {
                emoji: '🧡',
                users: [
                    {
                        id: '1090193884782526525',
                        name: 'FluffBOT',
                        image: 'https://cdn.discordapp.com/app-icons/1090193884782526525/1aed19e69224aeb09df782a3285e5e6a.png',
                        email: 'fluffbot@fluffici.eu'
                    }
                ]
            }
        ],
        embeds: buildEmbed(target)
    }

    const newMessage = new Message({streamId, type, user, profile, timestamp, reactions, embeds});

    await newMessage.save();
    await pusher.trigger('presence-chat-channel', 'new-message', {type, user, profile, timestamp, reactions, embeds});

    try {
        res.status(200).json({message: 'System message sent'});
    } catch (error) {
        res.status(500).json({error: 'Internal Server Error'});
    }
}

function buildEmbed(user: User): EmbedMessage[] {
    return [
        {
            color: "#acff95",
            author: {
                name: 'Welcome!',
                icon_url: 'https://autumn.fluffici.eu/attachments/DlcNdp36jtTOYLIUUNNPE58qFvXPeJ3ifSU0hZRXBv',
                url: 'https://fluffici.eu'
            },
            description: `Welcome ${user.name} to the MovieNight!`,
            timestamp: new Date().toISOString(),
            footer: {
                text: "FluffBOT",
                icon_url: "https://cdn.discordapp.com/app-icons/1090193884782526525/1aed19e69224aeb09df782a3285e5e6a.png"
            }
        }
    ];
}
