"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Item, Menu, useContextMenu } from "react-contexify";
import "react-contexify/dist/ReactContexify.css";
import axios from 'axios';
import { signIn, signOut, useSession } from 'next-auth/react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import GifPicker, { ContentFilter, TenorImage, Theme } from 'gif-picker-react';
import { CHAT_PERMISSION, USER_FLAGS } from '../lib/constants';
import { getAvatarsIconUrl, hasPermission } from '../lib/utils';
import { showToast } from "@/components/toast";
import {
    FaArrowRight,
    FaBan,
    FaCog,
    FaCrown,
    FaDiscord,
    FaEllipsisV,
    FaImages,
    FaReply,
    FaSmile,
    FaTrash,
    FaUser,
    FaUserLock
} from "react-icons/fa";
import { Button } from "@/components/button.tsx";
import { IProfile } from "@/models/Profile.ts";
import { IMessage } from "@/models/Message.ts";
import {FaBots, FaFaceSmile, FaMessage, FaRobot, FaShield} from 'react-icons/fa6';
import pusher from "@/lib/pusher.ts";
import ExternalRedirect from './redirect';
import { Embed } from './embed';
import SlashCommandManager from "@/lib/SlashCommandManager.ts";
import {ApplicationCommandOption, Message, SlashCommand} from '../lib/types';
import EmbedMessage from './EmbedMessage';
import registerCommands from "@/lib/CommandRegistry.ts";
import {getEmojiDataFromNative} from "emoji-mart";
import {User} from "next-auth";
import {hasPermissions} from "@/lib/permission.ts";

const CHANNEL_NAME = 'presence-chat-channel';
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [externalUrl, setExternalUrl] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [showBanDialog, setShowBanDialog] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [commands, setCommands] = useState<SlashCommand[]>([]);
    const [content, setContent] = useState<string>('');
    const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
    const [replyTo, setReplyTo] = useState<IMessage | null>(null);
    const [showWarning, setShowWarning] = useState<boolean>(false);
    const [warningMessage, setWarningMessage] = useState<string>('');
    const [profile, setProfile] = useState<IProfile>();
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const [emojiSuggestions, setEmojiSuggestions] = useState<string[]>([]);
    const [showGifPicker, setShowGifPicker] = useState<boolean>(false);
    const [users, setUsers] = useState<any[]>([]);
    const [commandSuggestions, setCommandSuggestions] = useState<{ name: string; description: string }[]>([]);
    const [commandOptions, setCommandOptions] = useState<ApplicationCommandOption[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [activeMessage, setActiveMessage] = useState<IMessage | null>();
    const { data: session, status, update } = useSession();
    const messageListRef = useRef<HTMLDivElement>(null); // Add a ref for the message list

    const user = session?.user;

    // @ts-ignore
    const HighlightUserMention = ({ user, message }) => {
        const username = user?.name;
        const regex = new RegExp(`@${username}\\b`, 'g');

        const messageHtml = { __html: message.content.replace(regex, `<span style='color:gold'>@${username}</span>`) };

        return <div dangerouslySetInnerHTML={messageHtml} />;
    }

    const fetchGifs = async (offset: number) => {
        const response = await axios.get(`/api/chat/fetch-giphy?offset=${offset}&limit=10`);
        return response.data;
    };

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get('/api/chat/messages-ack');
                setMessages(response.data.messages);
                setIsLoading(false);
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
                await axios.post('/api/chat/user-joined');
            } catch (error) { }
        }

        const fetchCommands = async () => {
            try {
                const response = await axios.get('/api/chat/command');
                setCommands(response.data.commands)
            } catch (error) { }
        }

        const isBanned = async () => {
            try {
                const response = await axios.get('/api/chat/is-banned');
                setWarningMessage(`You have been banned for breaking the rules.`);
                setShowWarning(response.data.status);
            } catch (error) { }
        }

        if (user) {
            sendSystemMessage();
        }

        fetchCommands()
        fetchMessages();
        fetchProfile();
        isBanned();
    }, [session, user, update]);

    useEffect(() => {
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

        // @ts-ignore
        channel.bind('pusher:subscription_succeeded', (members) => {
            setUsers(Object.values(members.members));
        });

        // @ts-ignore
        channel.bind('pusher:member_added', (member) => {
            setUsers((prevUsers) => [...prevUsers, member.info]);
        });

        // @ts-ignore
        channel.bind('pusher:member_removed', (member) => {
            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== member.id));
        });

        return () => {
            channel.unbind(NEW_MESSAGE_EVENT);
            channel.unbind(DELETE_MESSAGE_EVENT);
            channel.unbind(PERMISSION_CHANGED_EVENT);
            channel.unbind(USER_MUTED_EVENT);
            channel.unbind(BANNED_USER_EVENT);
            channel.unbind('pusher:subscription_succeeded');
            channel.unbind('pusher:member_added');
            channel.unbind('pusher:member_removed');
            pusher.unsubscribe(CHANNEL_NAME);
        };
    }, [session, user, update]);

    const handleCommand = async (command: { name: string; description: string }) => {
        const response = await axios.post(`/api/chat/command`, { command: command.name });

        if (!response.data.status) {
            showToast(response.data.error, "error")
        }

        setContent('');
        setReplyTo(null);
        setCommandSuggestions([])
    }

    const handleSendMessage = useCallback(async (type: 'user' | 'system' | 'bot' = 'user') => {
        if (!user) {
            showToast("Please log in to send messages", "error");
            return;
        }

        if (content.length <= 0) return;

        try {
            let result: Message = { content };
            await axios.post(`/api/chat/send-message`, { content: result.content, type });
            setMessages(prevMessages => [...prevMessages, result as IMessage]);

            setContent('');
            setReplyTo(null);
        } catch (error) {
            showToast("Failed to send message", "error");
        }
    }, [content, user]);

    const handleSendGif = useCallback(async (gifUrl: TenorImage) => {
        if (!user) {
            showToast("Please log in to send GIFs", "error");
            return;
        }

        try {
            await axios.post(`/api/chat/send-message`, { content: gifUrl.url, type: 'gif' });
            setShowGifPicker(false);
        } catch (error) {
            showToast("Failed to send GIF", "error");
        }
    }, [user]);

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

    const findCommand = (query: string) =>  {
        return commands.filter(command =>
            command.name.startsWith(query) &&
            hasPermissions(session?.profile.permissions! || 0, command.permissions || 0)
        );
    }

    const handleDeleteMessage = async (messageId: string) => {
        try {
            const response = await axios.post(`/api/chat/moderation/delete`, { messageId });

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
            const response = await axios.post(`/api/chat/moderation/mute`, { userId: message.user.id });
            if (response.data.status) {
                showToast(`${message.user.name} has been muted`);
            } else {
                showToast(response.data.message, "error");
            }
        } catch (error) {
            showToast(`A error occurred while muting ${message.user.name}`, "error");
        }
    }

    const handleBanUser = async (message: IMessage) => {
        try {
            const response = await axios.post(`/api/chat/moderation/ban`, { userId: message.user.id, reason });
            if (response.data.status) {
                showToast(`${message.user.name} has been banned for ${reason}`);
                setReason("");
            } else {
                showToast(response.data.message, "error");
            }
        } catch (error) {
            showToast(`A error occurred while muting ${message.user.name}`, "error");
        }

        setReason("");
        setShowBanDialog(false);
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
        if (flags & USER_FLAGS.BOT) badges.push(<FaRobot className="text-green-400" key="bot" />);
        return badges;
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleEmojiClick = (emojiObject: any, event: any) => {
        setContent(emojiObject.native);
        setShowEmojiPicker(false)
    };

    const handleEmojiInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setContent(value);

        if (value.startsWith('/')) {
            const query = value.slice(1);
            const suggestions = findCommand(query);
            setCommandSuggestions(suggestions);
            if (suggestions.length === 1) {
                setCommandOptions(suggestions[0].options || []);
            } else {
                setCommandOptions([]);
            }
        } else {
            setCommandSuggestions([]);
            setCommandOptions([]);
        }

        const lastColonIndex = value.lastIndexOf(':');
        if (lastColonIndex !== -1) {
            const textAfterColon = value.slice(lastColonIndex + 1);
            if (textAfterColon.length > 0) {
                const suggestions = getEmojiSuggestions(textAfterColon);
                setEmojiSuggestions(suggestions);
            } else {
                setEmojiSuggestions([]);
            }
        } else {
            setEmojiSuggestions([]);
        }

        const lastAtIndex = value.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const textAfterAt = value.slice(lastAtIndex + 1);
            if (textAfterAt.length > 0) {
                handleMentionSearch(textAfterAt);
            }
        }
    };

    const getEmojiSuggestions = (query: string) => {
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

    const renderEmojiReactions = (reactions: { emoji: string, users: User[] }[] = []) => {
        return reactions.map(reaction => (
            <div key={reaction.emoji} className="flex items-center mt-2" onClick={() => handleReactionClick(reaction.emoji)}>
                <span dangerouslySetInnerHTML={{ __html: reaction.emoji }} />
                <span className="ml-1">{reaction.users.length}</span>
                <div className="flex -space-x-2 ml-2">
                    {reaction.users.map(user => (
                        <img
                            key={user.id}
                            src={getAvatarsIconUrl(user)}
                            alt={user.name!}
                            className="w-6 h-6 rounded-full border-2 border-white"
                        />
                    ))}
                </div>
            </div>
        ));
    };

    const handleMentionSearch = (query: string) => {
        const filteredUsers = users.filter(user => user.name.toLowerCase().includes(query.toLowerCase()));
        if (filteredUsers.length > 0) {
            setEmojiSuggestions(filteredUsers.map(user => `@${user.name}`));
        } else {
            setEmojiSuggestions(["No user found"]);
        }
    };

    const detectUrls = (message: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return message.match(urlRegex);
    };

    const handleReactionClick = (emojiObject: any) => {
        if (activeMessage) {
            const emoji = emojiObject;
            const updatedMessage = { ...activeMessage };
            const reactionIndex = updatedMessage.reactions.findIndex((r: { emoji: any; }) => r.emoji === emoji);

            if (reactionIndex !== -1) {
                const userIndex = updatedMessage.reactions[reactionIndex].users.findIndex((u: { id: string; }) => u.id === user?.id);
                if (userIndex === -1) {
                    updatedMessage.reactions[reactionIndex].users.push(user!);
                } else {
                    updatedMessage.reactions[reactionIndex].users.splice(userIndex, 1);
                }
            } else {
                updatedMessage.reactions = [...(updatedMessage.reactions || []), { emoji, users: [user!] }];
            }

            setMessages(prevMessages =>
                prevMessages.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg)
            );

            axios.post('/api/chat/react-message', { messageId: activeMessage._id, user, emoji });
            setShowEmojiPicker(false);
            setActiveMessage(null)
        }
    };

    useEffect(() => {
        const messageList = messageListRef.current;
        if (messageList) {
            const isScrolledToBottom = messageList.scrollHeight - messageList.clientHeight <= messageList.scrollTop + 1;
            messageList.scrollTop = messageList.scrollHeight;

            if (isScrolledToBottom) {
                messageList.scrollTop = messageList.scrollHeight;
            }
        }
    }, [messages, isLoading]);

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
            <div className={`fixed ${isOverlay ? 'top-4 left-4 w-[600px] h-[400px] bg-opacity-90' : 'top-4 right-4 bottom-4 w-[calc(100%-32px)] md:w-[calc(25%-32px)] h-[calc(100%-32px)]'} bg-gray-900 text-white flex flex-col shadow-lg z-40 transition-transform transform md:translate-x-0 ${isCollapsed && !isOverlay ? 'translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
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
                <div className="flex-1 overflow-y-auto p-4" ref={messageListRef}> {/* Add ref here */}
                    {isLoading ? (
                        <div className="justify-center">
                            <p>Loading chat...</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div
                                    key={message._id}
                                    className={`p-2 ${message.type === 'system' ? 'text-center' : 'border-b border-gray-700'} hover:bg-gray-800 group`}
                                    onContextMenu={(e) => handleContextMenu(e, message, message.type)}
                                >
                                    <div className="relative">
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
                                            <span className="font-bold cursor-pointer" onClick={() => handleUserClick(message.user)}>
                                                {message.user.name}
                                            </span>
                                            <div className="text-sm text-gray-500 inline-flex space-x-3">{renderBadges(message.profile.flags)}</div>
                                        </div>
                                    )}
                                    {message.type === 'system' ? (
                                        <div className="flex space-x-3 items-center justify-center">
                                            <FaCog />
                                            <div>{message.content}</div>
                                        </div>
                                    ) : message.type === 'gif' ? (
                                        <div>
                                            <img
                                                src={message.content}
                                                data-gif={message.content}
                                                className="rounded cursor-pointer"
                                                alt="GIF"
                                            />
                                        </div>
                                    ) : message.type === 'bot' ? (
                                        <div className="relative pl-12">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <img
                                                    src={getAvatarsIconUrl(message.author)}
                                                    alt={message.author!.id}
                                                    className="w-8 h-8 rounded-full cursor-pointer"
                                                    onClick={() => handleUserClick(message.author)}
                                                />
                                                <span className="font-bold text-indigo-500 cursor-pointer" onClick={() => handleUserClick(message.author)}>
                                                    {message.author!.name}
                                                </span>
                                                <span className="text-gray-400">used</span>
                                                <span className="bg-blue-600 text-white px-2 py-1 rounded">{message.command}</span>
                                            </div>
                                            <div className="ml-10 relative">
                                                <div className="absolute left-[-20px] top-2 h-0 w-0 border-t-[10px] border-t-transparent border-r-[10px] border-r-gray-800 border-b-[10px] border-b-transparent"></div>
                                                {message.embeds && message.embeds.map((embed, i) => (
                                                    <EmbedMessage key={i} embed={embed} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <HighlightUserMention user={{ name: user?.name }} message={{ content: message.content }} />
                                            {detectUrls(message.content!)?.map((url) => (
                                                <Embed url={url} key={url} />
                                            ))}
                                        </div>
                                    )}
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
                                                <Picker data={data} onEmojiSelect={handleEmojiClick} />
                                            </div>
                                        )}
                                    </>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => setShowGifPicker(!showGifPicker)}
                                >
                                    <FaImages />
                                </Button>
                                {showGifPicker && (
                                    <div className="absolute bottom-16 right-4 bg-white z-50">
                                        <GifPicker tenorApiKey={"AIzaSyBVQLYT3FONCEj_r6425suu7I5CDH4copQ"} onGifClick={handleSendGif} theme={Theme.DARK} locale="cs" contentFilter={ContentFilter.HIGH} />
                                    </div>
                                )}
                            </div>
                            {commandSuggestions.length > 0 && (
                                <div className="absolute bottom-16 left-0 w-full bg-gray-800 p-4 shadow-lg rounded-md z-50">
                                    <div className="flex flex-col space-y-2">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <div key={index} className="cursor-pointer flex justify-between p-2 hover:bg-gray-700 rounded-md" onClick={(e) => handleCommand(suggestion)}>
                                                <span className="text-white font-semibold">/{suggestion.name}</span>
                                                <span className="text-gray-400 text-sm">{suggestion.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {commandOptions.length > 0 && (
                                        <div className="mt-2 border-t border-gray-700 pt-2">
                                            {commandOptions.map((option, index) => (
                                                <div key={index} className="flex justify-between p-2 hover:bg-gray-700 rounded-md">
                                                    <span className="text-white">{option.name}</span>
                                                    <span className="text-gray-400 text-sm">{option.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {emojiSuggestions.length > 0 && (
                                <div className="absolute bottom-16 left-0 w-full bg-gray-800 p-4 shadow-lg rounded-md z-50">
                                    <div className="flex flex-col space-y-2">
                                        {emojiSuggestions.map((emoji, index) => (
                                            <div key={index} className="cursor-pointer flex justify-between p-2 hover:bg-gray-700 rounded-md" onClick={(e) => handleEmojiSuggestionClick(emoji)}>
                                                <span className="text-white font-semibold">{emoji}</span>
                                                <span className="text-gray-400 text-sm"></span>
                                            </div>
                                        ))}
                                    </div>
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
            <ExternalRedirect isOpen={isDialogOpen} url={externalUrl} />
        </>
    );
};

export default Chat;
