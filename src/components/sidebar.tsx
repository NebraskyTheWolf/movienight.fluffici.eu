"use client"

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Stream {
    title: string;
    description: string;
}

const Sidebar = () => {
    const [stream, setStream] = useState<Stream | null>(null);

    useEffect(() => {
        const fetchStream = async () => {
            try {
                const response = await axios.get('/api/fetch-stream');
                setStream(response.data);
            } catch (error) {
                console.error('Failed to fetch stream details:', error);
            }
        };

        fetchStream();
    }, []);

    return (
        <div className="flex flex-col p-4 bg-gray-900 text-white">
            {stream ? (
                <>
                    <h2 className="text-xl font-bold">{stream.title}</h2>
                    <p>{stream.description}</p>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default Sidebar;
