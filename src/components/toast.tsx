// components/Toast.tsx
import { toast, Toaster } from 'react-hot-toast';
import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const Toast: React.FC = () => {
    return <Toaster position="top-right" reverseOrder={false} />;
};

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const baseClasses = 'p-4 rounded-lg shadow-md flex items-center space-x-3';
    const types = {
        success: {
            bg: 'bg-gray-800 text-green-500',
            icon: <FaCheckCircle className="text-green-500" />,
        },
        error: {
            bg: 'bg-gray-800 text-red-500',
            icon: <FaExclamationCircle className="text-red-500" />,
        },
        info: {
            bg: 'bg-gray-800 text-blue-500',
            icon: <FaInfoCircle className="text-blue-500" />,
        },
    };

    toast.custom((t) => (
        <div
            className={`${baseClasses} ${types[type].bg} ${t.visible ? 'animate-enter' : 'animate-leave'}`}
        >
            <div className="flex-shrink-0">{types[type].icon}</div>
            <div className="text-white">{message}</div>
        </div>
    ));
};

export default Toast;
