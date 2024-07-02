import React, { useState, useEffect } from 'react';
import { RingLoader } from 'react-spinners';

// @ts-ignore
const LoadingComponent = ({ loading }) => {
    const [message, setMessage] = useState('Loading, please wait...');

    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        if (loading) {
            timers.push(setTimeout(() => setMessage('This is taking longer than usual...'), 10000));
            timers.push(setTimeout(() => setMessage('Still loading, hang tight...'), 30000));
            timers.push(setTimeout(() => setMessage('Sorry for the delay, almost there...'), 60000));
        } else {
            setMessage('Loading, please wait...');
        }

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [loading]);

    return (
        loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <RingLoader color="#ffffff" />
                <p className="mt-4 text-white">{message}</p>
            </div>
        )
    );
};

export default LoadingComponent;
