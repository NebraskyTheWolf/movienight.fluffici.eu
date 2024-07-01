import React, { useState } from 'react';
import axios from "axios";
import ReactSwitch from "react-switch";
import {showToast} from "@/components/toast.tsx";

export const CHAT_PERMISSION = {
    SEND_MESSAGE: 1 << 0,
    DELETE_MESSAGE: 1 << 1,
    BAN_USER: 1 << 2,
    MUTE_USER: 1 << 3,
    BROADCAST: 1 << 4,
    MODERATION_DASHBOARD: 1 << 5,
    MOD_VIEW: 1 << 6,
    READ_MESSAGE_HISTORY: 1 << 7,
    ADMINISTRATOR: 1 << 8,
    MESSAGE_REACTION: 1 << 9,
    SEND_EMOJIS: 1 << 10,
    REPLY_MESSAGE: 1 << 11,
    PUBLISH_STREAM: 1 << 12,
};

const PERMISSION_LABELS = {
    [CHAT_PERMISSION.SEND_MESSAGE]: 'Send Message',
    [CHAT_PERMISSION.DELETE_MESSAGE]: 'Delete Message',
    [CHAT_PERMISSION.BAN_USER]: 'Ban User',
    [CHAT_PERMISSION.MUTE_USER]: 'Mute User',
    [CHAT_PERMISSION.BROADCAST]: 'Broadcast',
    [CHAT_PERMISSION.MODERATION_DASHBOARD]: 'Moderation Dashboard',
    [CHAT_PERMISSION.MOD_VIEW]: 'Mod View',
    [CHAT_PERMISSION.READ_MESSAGE_HISTORY]: 'Read Message History',
    [CHAT_PERMISSION.ADMINISTRATOR]: 'Administrator',
    [CHAT_PERMISSION.MESSAGE_REACTION]: 'Message Reaction',
    [CHAT_PERMISSION.SEND_EMOJIS]: 'Send Emojis',
    [CHAT_PERMISSION.REPLY_MESSAGE]: 'Reply Message',
    [CHAT_PERMISSION.PUBLISH_STREAM]: 'Publish Stream',
};

interface Mute {
    streamId: string;
    reason: string;
}

interface Ban {
    issuer: string;
    reason: string;
}

interface Sanction {
    mute?: Mute;
    ban?: Ban;
}

interface User {
    discordId: string;
    permissions: number;
    flags: number;
    sanction: Sanction;
    streamKey?: string;
}

interface DiscordUser {
    id: string;
    username: string;
}

interface UserCardProps {
    user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
    const [discord, setDiscord] = useState<DiscordUser>();
    const [isExpanded, setIsExpanded] = useState(false);
    const [permissions, setPermissions] = useState(user.permissions);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handlePermissionChange = (perm: number) => {
        const patchPermissions = async (perm: number) => {
            try {
                await axios.get(`/api/chat/moderation/patch-permissions?id=${user.discordId}&permissions=${perm}`)
            } catch (error) {
                showToast("Failed to change permissions", "error")
            }
        }

        setPermissions((prevPermissions) =>
            prevPermissions ^ perm
        );

        patchPermissions(permissions)
    };

    const fetchDiscordUser = async () => {
        try {
            const response = await axios.get(`/api/fetch-discord?discordId=${user.discordId}`)
            setDiscord(response.data)
        } catch (error) {}
    }

    fetchDiscordUser()

    return (
        <div className="p-4 bg-gray-900 text-gray-200 rounded-lg shadow-md">
            <div onClick={toggleExpand} className="cursor-pointer">
                <h3 className="text-xl font-bold">{discord?.username}</h3>
                <p className="text-gray-400">{user.discordId}</p>
            </div>
            {isExpanded && (
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Permissions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
                            <label key={perm} className="flex items-center justify-between">
                                <span>{label}</span>
                                <ReactSwitch
                                    checked={Boolean(permissions & Number(perm))}
                                    onChange={() => handlePermissionChange(Number(perm))}
                                    onColor="#4CAF50"
                                    offColor="#F44336"
                                    uncheckedIcon={false}
                                    checkedIcon={false}
                                />
                            </label>
                        ))}
                    </div>
                    <h4 className="font-semibold mt-4">Sanctions</h4>
                    {user.sanction.mute && (
                        <div className="mt-2">
                            <p className="text-gray-400">Muted on Stream: {user.sanction.mute.streamId}</p>
                            <p className="text-gray-400">Reason: {user.sanction.mute.reason}</p>
                        </div>
                    )}
                    {user.sanction.ban && (
                        <div className="mt-2">
                            <p className="text-gray-400">Banned by: {user.sanction.ban.issuer}</p>
                            <p className="text-gray-400">Reason: {user.sanction.ban.reason}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserCard;
