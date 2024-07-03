export const CHAT_PERMISSION = {
    SEND_MESSAGE: 1 << 0,
    DELETE_MESSAGE: 1 << 1,
    BAN_USER: 1 << 2,
    MUTE_USER: 1 << 3,
    BROADCAST: 1 << 4,
    MODERATION_DASHBOARD: 1 << 5,
    MOD_VIEW: 1 << 6,
    READ_MESSAGE_HISTORY: 1 << 7,
    ADMINISTRATOR: 1 << 8,

    MESSAGE_REACTION: 1 << 9,
    SEND_EMOJIS: 1 << 10,
    REPLY_MESSAGE: 1 << 11,

    PUBLISH_STREAM: 1 << 12,
    JOIN_PRESENCE: 1 << 13,
    USE_COMMAND: 1 << 14,
    SEND_GIF: 1 << 15,
    SEND_LINKS: 1 << 16,

};

export const USER_FLAGS = {
    VIEWER: 1 << 0,
    MODERATOR: 1 << 1,
    HOST: 1 << 2,
    BOT: 1 << 5
}

export const SYSTEM_MESSAGE_TYPE = {
    USER_JOINED: 1 << 0,
    USER_LEFT: 1 << 2,
    USER_WELCOME: 1 << 3,
    USER_MUTED: 1 << 4,
    USER_BANNED: 1 << 5,
    POLLS: 1 << 6,
    ANNOUNCEMENT: 1 << 7,
}

export const USE_GIPHY = Boolean(process.env.GIPHY_ENABLED);
