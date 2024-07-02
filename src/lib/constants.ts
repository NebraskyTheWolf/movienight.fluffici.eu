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
    JOIN_PRESENCE: 1 << 13
};

export const USER_FLAGS = {
    VIEWER: 1 << 0,
    MODERATOR: 1 << 1,
    HOST: 1 << 2
}

export const USE_GIPHY = Boolean(process.env.GIPHY_ENABLED);
