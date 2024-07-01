"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Item, Menu, useContextMenu } from "react-contexify";
import "react-contexify/dist/ReactContexify.css";
import axios from 'axios';
import {useSession, signIn, signOut} from 'next-auth/react';
import pusher from '../lib/pusher';
import { CHAT_PERMISSION, USER_FLAGS } from '../lib/constants';
import { getAvatarsIconUrl, hasPermission } from '../lib/utils';
import { showToast } from "@/components/toast";
import {
    FaCrown,
    FaDiscord,
    FaMessage,
    FaRegMessage,
    FaShield,
    FaUser,
    FaFaceSmile,
    FaArrowRight,
    FaReplyAll
} from "react-icons/fa6";
import {FaBan, FaUserLock, FaTrash, FaCog, FaReply, FaSmile, FaEllipsisV} from "react-icons/fa";
import { Button } from "@/components/button.tsx";
import EmojiPicker from 'emoji-picker-react';
import twemoji from 'twemoji';
import { IProfile } from "@/models/Profile.ts";
import {
    Dialog, DialogDescription,
    DialogTitle, DialogFooter,
    DialogHeader, DialogContent
} from "@/components/dialog.tsx";
import {IMessage} from "@/models/Message.ts";
import {useRouter} from "next/navigation";

const CHANNEL_NAME = 'chat-channel';
const NEW_MESSAGE_EVENT = 'new-message';
const REACT_MESSAGE_EVENT = 'react-message';
const DELETE_MESSAGE_EVENT = 'delete-message';
const PERMISSION_CHANGED_EVENT = 'permission_changed';
const USER_MUTED_EVENT = 'user-muted';
const BANNED_USER_EVENT = 'banned-user';

interface ChatProps {
    streamId?: string;
    isOverlay?: boolean;
}

const Chat: React.FC<ChatProps> = ({ isOverlay = false, streamId }) => {
    const [reason, setReason] = useState<string>("")
    const [showBanDialog, setShowBanDialog] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [content, setContent] = useState<string>('');
    const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
    const [replyTo, setReplyTo] = useState<IMessage | null>(null);
    const [showWarning, setShowWarning] = useState<boolean>(false);
    const [warningMessage, setWarningMessage] = useState<string>('');
    const [profile, setProfile] = useState<IProfile>();
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const [emojiSuggestions, setEmojiSuggestions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { data: session, status, update } = useSession();
    const router = useRouter()

    const user = session?.user;

    // @ts-ignore
    const HighlightUserMention = ({ user, message }) => {
        const username = user?.name;
        const regex = new RegExp(`@${username}\\b`, 'g');

        const messageHtml = { __html: message.content.replace(regex, `<span style='color:gold'>@${username}</span>`) };

        return <div dangerouslySetInnerHTML={messageHtml} />;
    }

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get('/api/chat/messages-ack');
                setMessages(response.data.messages);

                setIsLoading(false)
            } catch (error) { }
        };

        const fetchProfile = async () => {
            try {
                const response = await axios.get('/api/fetch-user');
                setProfile(response.data);
            } catch (error) { }
        }

        const sendSystemMessage = async () => {
            try {
                await axios.get('/api/chat/user-joined');
            } catch (error) {}
        }

        const isBanned = async () => {
            try {
                const response = await axios.get('/api/chat/is-banned');
                setWarningMessage(`You have been banned, Reason: ${response.data.ban.reason}`)
                setShowWarning(response.data.status)
            } catch (error) {}
        }

        if (user) {
            sendSystemMessage();
        }

        fetchMessages();
        fetchProfile()

        isBanned();

        const channel = pusher.subscribe(CHANNEL_NAME);

        channel.bind(NEW_MESSAGE_EVENT, (data: IMessage) => {
            setMessages((prevMessages) => [...prevMessages, data].sort((a, b) => a.timestamp - b.timestamp));
        });

        channel.bind(DELETE_MESSAGE_EVENT, (data: { id: string }) => {
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === data.id ? { ...msg, content: 'The message has been deleted' } : msg
                )
            );
        });

        channel.bind(PERMISSION_CHANGED_EVENT, (data: { id: string, permissions: number }) => {
            if (user && data.id === user.id) {
                update({ ...session, profile: { ...user, permissions: data.permissions } });
                showToast("Your permissions have been updated.", "info");
            }
        });

        channel.bind(REACT_MESSAGE_EVENT, (data: { messageId: string, reactions: [] }) => {
            setMessages((prevMessages) =>
                prevMessages.map(msg =>
                    msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg
                )
            );
        });

        channel.bind(USER_MUTED_EVENT, (data: { id: string }) => {
            if (user && data.id === user.id) {
                setWarningMessage("You have been muted for breaking the rules.");
                setShowWarning(true);
            }
        });

        channel.bind(BANNED_USER_EVENT, (data: { id: string }) => {
            if (user && data.id === user.id) {
                setWarningMessage("You have been banned for breaking the rules.");
                setShowWarning(true);
            }
        });

        return () => {
            channel.unbind(NEW_MESSAGE_EVENT);
            channel.unbind(DELETE_MESSAGE_EVENT);
            channel.unbind(PERMISSION_CHANGED_EVENT);
            channel.unbind(USER_MUTED_EVENT);
            channel.unbind(BANNED_USER_EVENT);
            pusher.unsubscribe(CHANNEL_NAME);
        };
    }, [session, user, update]);

    const handleSendMessage = useCallback(async (type: 'user' | 'system' = 'user') => {
        if (!user) {
            showToast("Please log in to send messages", "error");
            return;
        }

        // Safe guard against empty message ( client-side )
        if (content.length <= 0)
            return

        try {
            await axios.get(`/api/chat/send-message?content=${content}`);
            setContent('');
            setReplyTo(null);
        } catch (error) {
            showToast("Failed to send message", "error");
        }
    }, [content, user]);

    const { show } = useContextMenu({
        id: 'context-menu'
    });

    const handleContextMenu = (event: React.MouseEvent, message: IMessage, type: string) => {
        event.preventDefault();
        show({
            event,
            props: {
                message,
            },
        });
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            const response = await axios.get(`/api/chat/moderation/delete?messageId=${messageId}`);

            if (response.status === 200) {
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg._id === messageId ? { ...msg, content: 'The message has been deleted' } : msg
                    )
                );
            } else {
                showToast("Failed to delete message", "error");
            }
        } catch (error) {
            showToast("Failed to delete message", "error");
        }
    };

    const handleMuteUser = async (message: IMessage) => {
        try {
            const response = await axios.get(`/api/chat/moderation/mute?userId=${message.user.id}`);
            if (response.data.status) {
                showToast(`${message.user.name} has been muted`)
            } else {
                showToast(response.data.message, "error")
            }
        } catch (error) {
            showToast(`A error occurred while muting ${message.user.name}`, "error")
        }
    }

    const handleBanUser = async (message: IMessage) => {
        try {
            const response = await axios.get(`/api/chat/moderation/ban?userId=${message.user.id}?reason=${reason}`);
            if (response.data.status) {
                showToast(`${message.user.name} has been banned for  ${reason}`)
            } else {
                showToast(response.data.message, "error")
            }
        } catch (error) {
            showToast(`A error occurred while muting ${message.user.name}`, "error")
        }

        setReason("")
        setShowBanDialog(false)
    }

    const handleReplyMessage = (message: IMessage) => {
        setContent(`@${message.user.name} `);
        setReplyTo(message);
    };

    const handleUserClick = (user?: any) => {
        showToast("User clicked", "info");
    };

    const renderBadges = (flags: number = 0) => {
        const badges = [];
        if (flags & USER_FLAGS.VIEWER) badges.push(<FaUser className="text-cyan-400" key="viewer" />);
        if (flags & USER_FLAGS.MODERATOR) badges.push(<FaShield className="text-red-500" key="moderator" />);
        if (flags & USER_FLAGS.HOST) badges.push(<FaCrown className="text-yellow-200" key="host" />);
        return badges;
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleEmojiClick = (emojiObject: any, event: any) => {
        if (inputRef.current) {
            const cursorPosition = inputRef.current.selectionStart;
            const newText = content.slice(0, cursorPosition!) + emojiObject.emoji + content.slice(cursorPosition!);
            setContent(newText);
        }
    };

    const handleEmojiInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setContent(value);

        const lastColonIndex = value.lastIndexOf(':');
        if (lastColonIndex !== -1) {
            const textAfterColon = value.slice(lastColonIndex + 1);
            if (textAfterColon.length > 0) {
                // Fetch emoji suggestions based on the text after the colon
                const suggestions = getEmojiSuggestions(textAfterColon);
                setEmojiSuggestions(suggestions);
            } else {
                setEmojiSuggestions([]);
            }
        } else {
            setEmojiSuggestions([]);
        }
    };

    const getEmojiSuggestions = (query: string) => {
        // You can implement this function to return emoji suggestions based on the query
        // For simplicity, here we return an empty array
        return [];
    };

    const handleEmojiSuggestionClick = (emoji: string) => {
        if (inputRef.current) {
            const lastColonIndex = content.lastIndexOf(':');
            const newText = content.slice(0, lastColonIndex) + emoji + ' ';
            setContent(newText);
            setEmojiSuggestions([]);
        }
    };

    const renderEmojiReactions = (reactions: { emoji: string, users: any[] }[] = []) => {
        return reactions.map(reaction => (
            <div key={reaction.emoji} className="flex items-center mt-2">
                <span dangerouslySetInnerHTML={{ __html: reaction.emoji }} />
                <span className="ml-1">{reaction.users.length}</span>
                <div className="flex -space-x-2 ml-2">
                    {reaction.users.map(user => (
                        <img
                            key={user.id}
                            src={getAvatarsIconUrl(user)}
                            alt={user.name}
                            className="w-6 h-6 rounded-full border-2 border-white"
                        />
                    ))}
                </div>
            </div>
        ));
    };

    return (
        <>
            {showWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded shadow-lg text-center">
                        <h2 className="text-2xl font-bold mb-4 text-red-500">Warning</h2>
                        <p className="mb-4 text-black">{warningMessage}</p>
                        <button onClick={() => signOut({ callbackUrl: window.location.href, redirect: false })} className="px-4 py-2 bg-red-500 text-white rounded">
                            Close
                        </button>
                    </div>
                </div>
            )}
            {!isOverlay && (
                <button
                    className="fixed top-4 right-4 z-50 text-white p-2 rounded md:hidden"
                    onClick={toggleCollapse}
                >
                    {isCollapsed && <FaMessage />}
                </button>
            )}
            <div className={`fixed ${isOverlay ? 'top-4 left-4 w-[300px] h-[400px] bg-opacity-90' : 'top-4 right-4 bottom-4 w-[calc(100%-32px)] md:w-[calc(25%-32px)] h-[calc(100%-32px)]'} bg-gray-900 text-white flex flex-col shadow-lg z-40 transition-transform transform md:translate-x-0 ${isCollapsed && !isOverlay ? 'translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                <div className="flex justify-between items-center p-4 border-b border-pink-600">
                    <h2 className="text-xl font-bold">CHAT</h2>
                    {!isOverlay && (
                        <button
                            className="md:hidden text-white"
                            onClick={toggleCollapse}
                        >
                            ×
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="justify-center">
                            <p>Loading chat...</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div
                                    key={message._id}
                                    className={`p-2  ${message.type === 'system' ? 'text-center' : 'border-b border-gray-700'}`}
                                    onContextMenu={(e) => handleContextMenu(e, message, message.type)}
                                >
                                    <div className="group relative">
                                        <div className="absolute hidden group-hover:flex items-center right-0 top-0 space-x-2">
                                            <button className="p-1" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                                <FaSmile />
                                            </button>
                                            <button className="p-1" onClick={(e) => handleContextMenu(e, message, message.type)}>
                                                <FaEllipsisV />
                                            </button>
                                        </div>
                                    </div>
                                    {message.user && (
                                        <div className="flex items-center space-x-2">
                                            <img
                                                src={getAvatarsIconUrl(message.user)}
                                                alt={message.user.id}
                                                className="w-8 h-8 rounded-full cursor-pointer"
                                                onClick={() => handleUserClick(message.user)}
                                            />
                                            <span className="font-bold cursor-pointer"
                                                  onClick={() => handleUserClick(message.user)}>
                                        {message.user.name}
                                    </span>
                                            <div className="text-sm text-gray-500 inline-flex space-x-3">{renderBadges(message.profile.flags)}</div>
                                        </div>
                                    )}

                                    {message.type === 'system' ? (
                                        <>
                                            <div className="flex space-x-3 items-center justify-center">
                                                <FaCog />
                                                <div>{message.content}</div>
                                            </div>
                                        </>
                                    ) : (<div><HighlightUserMention user={{name: user?.name}} message={{content: message.content}} /></div>)}

                                    {renderEmojiReactions(message.reactions)}
                                </div>
                            ))}
                        </>
                    )}
                </div>
                {status === 'loading' ? (
                    <div className="p-4 border-t border-pink-600">
                        <p>Loading...</p>
                    </div>
                ) : session ? (
                    hasPermission(profile, CHAT_PERMISSION.SEND_MESSAGE) ? (
                        <div className="p-4 border-t border-pink-600">
                            {replyTo && (
                                <div className="p-2 bg-gray-700 text-white flex justify-between items-center">
                                    <div>
                                        Replying to <span className="font-bold">@{replyTo.user?.name}</span>: {replyTo.content}
                                    </div>
                                    <button onClick={() => setReplyTo(null)} className="text-red-500">Cancel</button>
                                </div>
                            )}
                            <div className="flex">
                                <input
                                    type="text"
                                    className="flex-1 p-2 bg-gray-700 border-none outline-none"
                                    placeholder="Type a message..."
                                    value={content}
                                    onChange={handleEmojiInput}
                                    onKeyDown={(e) => {
                                        if (e.key == "Enter") {
                                            handleSendMessage();
                                        }
                                    }}
                                    ref={inputRef}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => handleSendMessage()}
                                >
                                    <FaArrowRight />
                                </Button>
                                {!isOverlay && user && hasPermission(profile, CHAT_PERMISSION.SEND_EMOJIS) && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        >
                                            <FaFaceSmile />
                                        </Button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-16 right-4">
                                                <EmojiPicker onEmojiClick={handleEmojiClick} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            {!isOverlay && emojiSuggestions.length > 0 && (
                                <div className="absolute bg-white p-2 shadow-lg rounded-md">
                                    {emojiSuggestions.map(emoji => (
                                        <div
                                            key={emoji}
                                            className="cursor-pointer"
                                            onClick={() => handleEmojiSuggestionClick(emoji)}
                                        >
                                            {emoji}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-center">You are restricted from sending messages.</p>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center p-4 border-t border-pink-600">
                        <p className="mb-4 text-center">Please log in to send messages.</p>
                        <Button
                            variant="outline"
                            onClick={() => signIn('discord', { callbackUrl: window.location.href })}
                        >
                            <div className="flex space-x-3 items-center">
                                <FaDiscord />
                                <p>Log in</p>
                            </div>
                        </Button>
                    </div>
                )}
            </div>
            <Menu id="context-menu">
                {profile && hasPermission(profile, CHAT_PERMISSION.DELETE_MESSAGE) && (
                    <Item onClick={({ props }) => handleDeleteMessage(props.message._id)}> <FaTrash /> Delete</Item>
                )}
                {profile && hasPermission(profile, CHAT_PERMISSION.BAN_USER) && (
                    <Item onClick={({ props }) => handleBanUser(props.message)}><FaBan /> Ban User</Item>
                )}
                {profile && hasPermission(profile, CHAT_PERMISSION.MUTE_USER) && (
                    <Item onClick={({ props }) => handleMuteUser(props.message)}><FaUserLock /> Mute User</Item>
                )}
                <Item onClick={({ props }) => handleReplyMessage(props.message)}><FaReply /> Reply</Item>
            </Menu>
        </>
    );
};

export default Chat;
