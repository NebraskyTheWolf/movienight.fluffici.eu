import React from 'react';
import AccessGate from "@/components/access.tsx";

const Dashboard: React.FC = () => {
    return (
        <div className="flex flex-col h-screen">
            <div className="flex-1 flex relative">
                <AccessGate />
            </div>
        </div>
    );
};

export default Dashboard;
