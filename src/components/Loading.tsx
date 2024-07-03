import React, { useState, useEffect } from 'react';
import { RingLoader } from 'react-spinners';

// @ts-ignore
const LoadingComponent = ({ loading }) => {
    const [message, setMessage] = useState('Načítání, prosím, čekejte...');

    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        if (loading) {
            timers.push(setTimeout(() => setMessage('Trvá to trochu déle než obvykle.'), 10000));
            timers.push(setTimeout(() => setMessage('Stále se to načítá, vydržte...'), 30000));
            timers.push(setTimeout(() => setMessage('Omlouváme se za zpoždění, už to bude...'), 60000));
        } else {
            setMessage('Načítání, prosím, čekejte...');
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
