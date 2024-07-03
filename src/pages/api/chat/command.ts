import { NextApiRequest, NextApiResponse } from 'next';
import SlashCommandManager from '@/lib/SlashCommandManager.ts';
import Message from "@/models/Message.ts";
import registerCommands from "@/lib/CommandRegistry.ts";
import {getServerSession, User} from "next-auth";
import {authOptions} from "@/pages/api/auth/[...nextauth].ts";
import {hasPermission} from "@/lib/utils.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import Pusher from "pusher";
import connectToDatabase from "@/lib/mongodb.ts";
import Stream from "@/models/Stream.ts";
import {IProfile} from "@/models/Profile.ts";
import {hasPermissions} from "@/lib/permission.ts";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

const commandManager = new SlashCommandManager();
registerCommands(commandManager)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session)
        return res.status(401).json({ status: false, error: 'Unauthorized' });
    if (!hasPermission(session.profile, CHAT_PERMISSION.USE_COMMAND))
        return res.status(403).json({ status: false, error: 'You are not permitted to use commands.' });

    if (req.method === 'POST') {
        const { command } = req.body
        if (!command)
            return res.status(400).json({ status: false, error: 'Command is required' });

        const handle = commandManager.getCommand(command)

        if (!commandManager.hasCommand(command)) {
            return res.status(404).json({ status: false, error: 'Command not found' });
        } else if (handle.permissions && !hasPermissions(session.profile.permissions, handle.permissions)) {
            return res.status(403).json({ status: false, error: 'Insufficient permissions' });
        }

        const { content, embeds } = await commandManager.executeCommand(command);

        await connectToDatabase();
        const stream = await Stream.findOne({});

        if (!stream) {
            return res.status(404).json({ status: false, error: 'Stream not found' });
        }

        const { streamId } = stream
        const { timestamp, reactions} = {
            timestamp: Date.now(),
            reactions: []
        }

        const type = 'command'
        const user: User = {
            id: '1090193884782526525',
            name: 'FluffBOT',
            image: 'https://cdn.discordapp.com/app-icons/1090193884782526525/1aed19e69224aeb09df782a3285e5e6a.png',
            email: 'fluffbot@fluffici.eu'
        }

        const profile: IProfile = {
            discordId: '1090193884782526525',
            permissions: 0,
            streamKey: 'null',
            flags: 32,
            sanction: {}
        }

        const author: User = session.user;

        const newMessage = new Message({
            streamId,
            content,
            command,
            type,
            user,
            author,
            profile,
            timestamp,
            reactions,
            embeds
        });

        const data = await newMessage.save();
        const id = data._id;

        try {
            await pusher.trigger('presence-chat-channel', 'new-message', {
                id,
                content,
                command,
                type,
                user,
                author,
                profile,
                timestamp,
                reactions,
                embeds
            });

            return res.status(200).json({ status: true, message: data._id });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ status: false, error: 'Internal Server Error' });
        }
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            status: true,
            commands: commandManager.listCommands()
        });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({
        status: false,
        error: `Method ${req.method} Not Allowed`
    });
}
