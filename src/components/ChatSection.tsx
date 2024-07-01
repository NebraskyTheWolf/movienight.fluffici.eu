import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface AutoModerationSettings {
    blacklist: string[];
    regexPatterns: string[];
}

interface ChatSettings {
    enableChat: boolean;
    autoModeration: AutoModerationSettings;
}

const ChatSection: React.FC = () => {
    const [settings, setSettings] = useState<ChatSettings>({
        enableChat: true,
        autoModeration: {
            blacklist: [],
            regexPatterns: [],
        },
    });

    const [newBlacklistWord, setNewBlacklistWord] = useState('');
    const [newRegexPattern, setNewRegexPattern] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchChatSettings = async () => {
            try {
                const response = await axios.get('/api/chat/settings');
                setSettings(response.data);
            } catch (error) {
                console.error('Failed to fetch chat settings', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChatSettings();
    }, []);

    const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setSettings((prevSettings) => ({
            ...prevSettings,
            [name]: checked,
        }));
    };

    const handleBlacklistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewBlacklistWord(e.target.value);
    };

    const handleRegexPatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewRegexPattern(e.target.value);
    };

    const addBlacklistWord = () => {
        if (newBlacklistWord.trim() !== '') {
            setSettings((prevSettings) => ({
                ...prevSettings,
                autoModeration: {
                    ...prevSettings.autoModeration,
                    blacklist: [...prevSettings.autoModeration.blacklist, newBlacklistWord.trim()],
                },
            }));
            setNewBlacklistWord('');
        }
    };

    const addRegexPattern = () => {
        if (newRegexPattern.trim() !== '') {
            setSettings((prevSettings) => ({
                ...prevSettings,
                autoModeration: {
                    ...prevSettings.autoModeration,
                    regexPatterns: [...prevSettings.autoModeration.regexPatterns, newRegexPattern.trim()],
                },
            }));
            setNewRegexPattern('');
        }
    };

    const removeBlacklistWord = (word: string) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            autoModeration: {
                ...prevSettings.autoModeration,
                blacklist: prevSettings.autoModeration.blacklist.filter((w) => w !== word),
            },
        }));
    };

    const removeRegexPattern = (pattern: string) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            autoModeration: {
                ...prevSettings.autoModeration,
                regexPatterns: prevSettings.autoModeration.regexPatterns.filter((p) => p !== pattern),
            },
        }));
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            await axios.put('/api/chat/settings', settings);
            alert('Settings updated successfully!');
        } catch (error) {
            console.error('Failed to update settings', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-200">Loading settings...</div>;
    }

    return (
        <div className="p-6 rounded-lg shadow-md bg-gray-900 text-gray-200">
            <h2 className="text-3xl font-bold mb-6">Chat Settings</h2>
            <div className="space-y-6">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="enableChat"
                        checked={settings.enableChat}
                        onChange={handleSettingChange}
                        className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <label className="ml-2 text-lg">Enable Chat</label>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold mb-4">Auto Moderation</h3>
                    <div className="mb-6">
                        <h4 className="font-medium text-lg mb-2">Blacklisted Words</h4>
                        <div className="flex items-center mb-4">
                            <input
                                type="text"
                                value={newBlacklistWord}
                                onChange={handleBlacklistChange}
                                className="flex-grow p-2 border rounded bg-gray-800 text-gray-200 mr-2"
                                placeholder="Add a word to blacklist"
                            />
                            <button
                                onClick={addBlacklistWord}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Add
                            </button>
                        </div>
                        <ul className="list-disc list-inside">
                            {settings.autoModeration.blacklist.map((word, index) => (
                                <li key={index} className="flex items-center justify-between mb-2">
                                    <span>{word}</span>
                                    <button
                                        onClick={() => removeBlacklistWord(word)}
                                        className="text-red-500 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-lg mb-2">Regex Patterns</h4>
                        <div className="flex items-center mb-4">
                            <input
                                type="text"
                                value={newRegexPattern}
                                onChange={handleRegexPatternChange}
                                className="flex-grow p-2 border rounded bg-gray-800 text-gray-200 mr-2"
                                placeholder="Add a regex pattern"
                            />
                            <button
                                onClick={addRegexPattern}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Add
                            </button>
                        </div>
                        <ul className="list-disc list-inside">
                            {settings.autoModeration.regexPatterns.map((pattern, index) => (
                                <li key={index} className="flex items-center justify-between mb-2">
                                    <span>{pattern}</span>
                                    <button
                                        onClick={() => removeRegexPattern(pattern)}
                                        className="text-red-500 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <button
                    onClick={saveSettings}
                    className="px-6 py-3 bg-green-600 text-white rounded shadow hover:bg-green-700 disabled:opacity-50"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default ChatSection;
