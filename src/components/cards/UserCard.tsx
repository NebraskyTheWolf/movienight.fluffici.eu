"use client"

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactSwitch from 'react-switch';
import { showToast } from '@/components/toast.tsx';
import { CHAT_PERMISSION } from '@/lib/constants';

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
    avatar: string;
    banner: string;
    banner_color: string;
}

interface UserCardProps {
    user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
    const [discord, setDiscord] = useState<DiscordUser>();
    const [isExpanded, setIsExpanded] = useState(false);
    const [permissions, setPermissions] = useState(user.permissions);

    useEffect(() => {
        const fetchDiscordUser = async () => {
            try {
                const response = await axios.get(`/api/fetch-discord?discordId=${user.discordId}`);
                setDiscord(response.data);
            } catch (error) {
                console.error('Failed to fetch Discord user', error);
            }
        };

        fetchDiscordUser();
    }, [user.discordId]);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handlePermissionChange = async (perm: number) => {
        const patchPermissions = async (perm: number) => {
            try {
                await axios.get(`/api/chat/moderation/patch-permissions?id=${user.discordId}&permissions=${perm}`);
            } catch (error) {
                showToast('Failed to change permissions', 'error');
            }
        };

        setPermissions((prevPermissions) => prevPermissions ^ perm);

        patchPermissions(permissions);
    };

    return (
        <div className="p-4 bg-gray-900 text-gray-200 rounded-lg shadow-md">
            {discord && (
                <div>
                    <div
                        className="h-32 bg-cover bg-center rounded-t-lg"
                        style={{ backgroundImage: `url('https://cdn.discordapp.com/banners/${discord.id}/${discord.banner}.png')`, borderTop: 4, borderTopColor: `${discord.banner_color}` }}
                    />
                    <div className="flex items-center mt-4">
                        <img
                            src={`https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png`}
                            alt={discord.username}
                            className="w-16 h-16 rounded-full border-2 border-gray-700"
                        />
                        <div className="ml-4">
                            <h3 className="text-xl font-bold">{discord.username}</h3>
                            <p className="text-gray-400">{user.discordId}</p>
                        </div>
                    </div>
                </div>
            )}
            <div onClick={toggleExpand} className="cursor-pointer mt-4">
                <h4 className="font-semibold mb-2">Permissions</h4>
                {isExpanded && (
                    <div>
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
                                        disabled={Boolean(permissions & Number(CHAT_PERMISSION.ADMINISTRATOR))}
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
        </div>
    );
};

export default UserCard;
