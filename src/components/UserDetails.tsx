"use client"

import React, {useEffect, useState} from 'react';
import Switch from 'react-switch';
import { IProfile } from '@/models/Profile';
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import axios from "axios";
import {showToast} from "@/components/toast.tsx";

interface UserDetailsProps {
    user: IProfile;
    onClose: () => void;
}

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
    [CHAT_PERMISSION.JOIN_PRESENCE]: 'Join Presence',
    [CHAT_PERMISSION.USE_COMMAND]: 'Use Command'
};

interface DiscordUser {
    id: string;
    username: string;
}

const UserDetails: React.FC<UserDetailsProps> = ({ user, onClose }) => {
    const [permissions, setPermissions] = useState(user.permissions);
    const [discord, setDiscord] = useState<DiscordUser>();

    useEffect(() => {
        const fetchDiscordUser = async () => {
            try {
                const response = await axios.get(`/api/fetch-discord?discordId=${user.discordId}`)
                setDiscord(response.data)
            } catch (error) {}
        }

        fetchDiscordUser()
    }, []);

    const handlePermissionChange = (perm: number) => {
        const patchPermissions = async (perm: number) => {
            try {
                await axios.post(`/api/chat/moderation/patch-permissions`, { id: user.discordId, permissions: perm })
            } catch (error) {
                showToast("Failed to change permissions", "error")
            }
        }
        setPermissions((prevPermissions) => prevPermissions ^ perm);

        patchPermissions(permissions)
    };

    const muteUser = async () => {
        try {
            const response = await axios.post(`/api/chat/moderation/mute`, { userId: user.discordId });
            if (response.data.status) {
                showToast(`${user.discordId} has been muted`)
            } else {
                showToast(response.data.message, "error")
            }
        } catch (error) {
            showToast(`A error occurred while muting`, "error")
        }
    };

    const banUser = () => {

    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-gray-800 text-gray-200 rounded-lg shadow-md p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">{discord?.username}</h3>
                    <button onClick={onClose} className="text-red-500 hover:underline">Close</button>
                </div>
                <div className="mb-4">
                    <h4 className="font-semibold mb-2">Permissions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
                            <label key={perm} className="flex items-center justify-between">
                                <span>{label}</span>
                                <Switch
                                    checked={Boolean(permissions & Number(perm))}
                                    onChange={() => handlePermissionChange(Number(perm))}
                                    onColor="#4CAF50"
                                    offColor="#F44336"
                                    uncheckedIcon={false}
                                    checkedIcon={false}
                                    disabled={Boolean(permissions & Number(CHAT_PERMISSION))}
                                />
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={muteUser}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                        Mute
                    </button>
                    <button
                        onClick={banUser}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Ban
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
