"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import {IProfile} from "@/models/Profile.ts";
import {Button} from "@/components/button.tsx";
import {showToast} from "@/components/toast.tsx";
import {v4} from "uuid";
import {encodeToBase64} from "next/dist/build/webpack/loaders/utils";
import {Data} from "@/pages/api/stream/patch.ts";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/dialog.tsx";

const SettingsSection: React.FC = () => {
    const [showConfirm, setShowConfirm] = useState<boolean>(false)
    const [streamKey, setStreamKey] = useState<string>();
    const [streamInfo, setStreamInfo] = useState({
        title: '',
        contentRating: { age: 0, reason: '' }
    });

    useEffect(() => {
        // Fetch stream information when component mounts
        const fetchStreamInfo = async () => {
            try {
                const response = await axios.get('/api/stream/stream');
                setStreamInfo(response.data);
            } catch (error) {
                showToast("Failed to fetch stream information", "error")
            }
        };

        fetchStreamInfo();
    }, []);

    useEffect(() => {
        // Fetch stream information when component mounts
        const fetchUser = async () => {
            try {
                const response = await axios.get('/api/fetch-user');
                setStreamKey(response.data.streamKey)
            } catch (error) {
                showToast("Failed to fetch user information", "error")
            }
        };

        fetchUser();
    }, []);

    const regenerateStreamKey = async () => {
        try {
            const response = await axios.post('/api/stream/regenerate-key');
            setStreamKey(response.data.newKey);
            setShowConfirm(false)
            showToast("Your stream key has been regenerated", "success")
        } catch (error) {
            showToast("'Failed to regenerate stream key", "error")
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStreamInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleContentRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStreamInfo((prev) => ({
            ...prev,
            contentRating: {
                ...prev.contentRating,
                [name]: value,
            },
        }));
    };

    const updateStreamInfo = async () => {
        try {
            await axios.get(`/api/stream/patch?data=${encodeToBase64<Data>({
                title: streamInfo.title,
                contentRating: {
                    age: streamInfo.contentRating.age,
                    reason: streamInfo.contentRating.reason
                }
            })}`);
            showToast("Stream information updated successfully!", "success");
        } catch (error) {
            showToast("Failed to update stream information", "error");
        }
    };

    const handleTokenCopy = (event: any) => {
        navigator.clipboard.writeText(event.target.value);
        showToast("Stream key copied to clipboard", "success");
    }

    return (
        <div className="p-6 rounded-lg shadow-md bg-gray-800">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <div className="bg-gray-700 p-4 rounded-lg shadow-md mb-4">
                <h3 className="text-xl font-semibold mb-2">Stream Information</h3>
                <div className="mb-4">
                    <label className="block font-medium text-gray-300">Title:</label>
                    <input
                        type="text"
                        name="title"
                        value={streamInfo.title}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded bg-gray-900 text-gray-300 border-gray-600"
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-medium text-gray-300">Content Rating Age:</label>
                    <input
                        type="number"
                        name="age"
                        value={streamInfo.contentRating.age}
                        onChange={handleContentRatingChange}
                        className="w-full p-2 border rounded bg-gray-900 text-gray-300 border-gray-600"
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-medium text-gray-300">Content Rating Reason:</label>
                    <input
                        type="text"
                        name="reason"
                        value={streamInfo.contentRating.reason}
                        onChange={handleContentRatingChange}
                        className="w-full p-2 border rounded bg-gray-900 text-gray-300 border-gray-600"
                    />
                </div>
                <div className="flex items-center mb-4">
                    <label className="w-32 font-medium text-gray-300">Stream Key:</label>
                    <input
                        type="password"
                        value={streamKey}
                        placeholder="No stream key detected"
                        readOnly
                        onClick={handleTokenCopy}
                        className="flex-1 p-2 border rounded bg-gray-900 text-gray-300 border-gray-600 mr-2"
                    />
                    <Button
                        onClick={() => setShowConfirm(true)}
                        variant="destructive"
                    >
                        Regenerate
                    </Button>
                </div>
                <Button
                    onClick={updateStreamInfo}
                    variant="outline"
                >
                    Save
                </Button>
            </div>
            {showConfirm && (
                <Dialog open={showConfirm} onOpenChange={() => setShowConfirm(false)}>
                    <DialogContent className="w-full max-w-lg rounded shadow-lg bg-gray-800">
                        <DialogHeader className="border-b p-4">
                            <DialogTitle className="text-lg font-semibold">Are you sure?</DialogTitle>
                        </DialogHeader>
                        <DialogDescription className="p-4 flex flex-col">If you continue, your stream key will be regenerated!</DialogDescription>
                        <DialogFooter className="p-4">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={regenerateStreamKey}
                                className="mr-2"
                            >
                                Continue
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowConfirm(false)}
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default SettingsSection;
