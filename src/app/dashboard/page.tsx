"use client";

import DashboardScreen from '@/components/moderation';
import React from 'react';

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
