"use client";

import DashboardScreen from '@/components/moderation';
import React from 'react';
import {getSession, GetSessionParams} from "next-auth/react";
import {hasPermission} from "@/lib/utils.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";

const Dashboard: React.FC = () => {
    return (
        <div className="flex flex-col h-screen">
            <div className="flex-1 flex relative">
                <DashboardScreen />
            </div>
        </div>
    );
};

export default Dashboard;
