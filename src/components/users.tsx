import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { IProfile } from '@/models/Profile.ts';
import UserDetails from './UserDetails';
import {showToast} from "@/components/toast.tsx";



const UsersSection: React.FC = () => {
    const [users, setUsers] = useState<IProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<IProfile | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/api/users');
                setUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch users', error);
            }
        };

        fetchUsers();
    }, []);



    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Users</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 text-gray-200 rounded-lg">
                    <thead>
                    <tr className="w-full bg-gray-700 text-left">
                        <th className="p-3">Discord ID</th>
                        <th className="p-3">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((user) => (
                        <tr
                            key={user.discordId}
                            className="border-b border-gray-700 cursor-pointer hover:bg-gray-700"
                            onClick={() => setSelectedUser(user)}
                        >
                            <td className="p-3">{user.discordId}</td>
                            <td className="p-3">
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            const response = await axios.get(`/api/chat/moderation/mute?userId=${user.discordId}`);
                                            if (response.data.status) {
                                                showToast(`${user.discordId} has been muted`)
                                            } else {
                                                showToast(response.data.message, "error")
                                            }
                                        } catch (error) {
                                            showToast(`A error occurred while muting`, "error")
                                        }
                                    }}
                                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                                >
                                    Mute
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Implement ban functionality
                                    }}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Ban
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {selectedUser && (
                <UserDetails
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
};

export default UsersSection;
