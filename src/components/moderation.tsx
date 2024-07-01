"use client";

import React, { useState } from 'react';
import {GetSessionParams, getSession, useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {FaHome, FaChartBar, FaCog, FaComments, FaStream} from 'react-icons/fa';
import {FaUsers} from "react-icons/fa6";
import SettingsSection from './settings';
import AnalyticsSection from './analytics';
import {router} from "next/client";
import {showToast} from "@/components/toast.tsx";
import {hasPermission} from "@/lib/utils.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import {Link} from 'lucide-react';

export async function getServerSideProps(context: { req: GetSessionParams | undefined; }) {
    const session = await getSession(context.req)

    if (!session ||
        !hasPermission(session?.profile, CHAT_PERMISSION.MODERATION_DASHBOARD)) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    return {
        props: {},
    };
}

const DashboardScreen: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('home');
    const { data: session, status } = useSession();

    const renderSection = () => {
        switch (activeSection) {
            case 'home':
                return <HomeSection />;
            case 'analytics':
                return <AnalyticsSection />;
            case 'settings':
                return <SettingsSection />;
            case 'chat':
                return <ChatSection />;
            default:
                return <HomeSection />;
        }
    };

    return (
        <div className="flex h-screen">
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <Link href="/">
                    <div className="p-4 text-2xl font-bold bg-gray-900">Movie Night</div>
                </Link>
                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveSection('home')}
                        className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-700 ${activeSection === 'home' ? 'bg-gray-700' : ''}`}
                    >
                        <FaUsers/> <span>Users</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('analytics')}
                        className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-700 ${activeSection === 'analytics' ? 'bg-gray-700' : ''}`}
                    >
                        <FaChartBar/> <span>Analytics</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('chat')}
                        className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-700 ${activeSection === 'chat' ? 'bg-gray-700' : ''}`}
                    >
                        <FaComments/> <span>Chat</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('settings')}
                        className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-700 ${activeSection === 'settings' ? 'bg-gray-700' : ''}`}
                    >
                        <FaCog/> <span>Settings</span>
                    </button>
                </nav>
            </aside>
            <main className="flex-1 p-6 overflow-y-auto">
                {renderSection()}
            </main>
        </div>
    );
};

const HomeSection: React.FC = () => (
    <div className="p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Home</h2>
        <p>Welcome to your dashboard!</p>
    </div>
);

const ChatSection: React.FC = () => (
    <div className="p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Chat</h2>
        <p>Here you can manage chats.</p>
    </div>
);

export default DashboardScreen;
