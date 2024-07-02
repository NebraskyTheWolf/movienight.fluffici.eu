export type ApplicationCommandOptionType =
    'SUB_COMMAND' |
    'SUB_COMMAND_GROUP' |
    'STRING' |
    'INTEGER' |
    'BOOLEAN' |
    'USER' |
    'CHANNEL' |
    'ROLE' |
    'MENTIONABLE' |
    'NUMBER';

export interface ApplicationCommandOptionChoice {
    name: string;
    value: string | number;
}

export interface ApplicationCommandOption {
    type: ApplicationCommandOptionType;
    name: string;
    description: string;
    required?: boolean;
    choices?: ApplicationCommandOptionChoice[];
    options?: ApplicationCommandOption[];
    min_value?: number;
    max_value?: number;
    min_length?: number;
    max_length?: number;
}

export interface EmbedMessage {
    color: number;
    title?: string;
    url?: string;
    author?: {
        name: string;
        icon_url: string;
        url: string;
    };
    description?: string;
    thumbnail?: {
        url: string;
    };
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    image?: {
        url: string;
    };
    timestamp?: string;
    footer?: {
        text: string;
        icon_url: string;
    };
}

export interface Message {
    content?: string;
    ephemeral?: boolean;
    embeds?: EmbedMessage[];
}

export interface SlashCommand {
    name: string;
    description: string;
    options?: ApplicationCommandOption[];
    execute: (args: any) => Message;
}
