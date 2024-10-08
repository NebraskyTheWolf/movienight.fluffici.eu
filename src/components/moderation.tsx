"use client"

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
import UsersSection from "@/components/users.tsx";
import ChatSection from './ChatSection';

const DashboardScreen: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('home');

    const renderSection = () => {
        switch (activeSection) {
            case 'home':
                return <UsersSection />;
            case 'analytics':
                return <AnalyticsSection />;
            case 'settings':
                return <SettingsSection />;
            case 'chat':
                return <ChatSection />;
            default:
                return <UsersSection />;
        }
    };

    return (
        <div className="flex h-screen">
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-4 text-2xl font-bold bg-gray-900" onClick={() => window.location.href = '/' }>Movie Night</div>
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

export default DashboardScreen;
