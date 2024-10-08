import mongoose, { Schema, Model } from 'mongoose';
import {Sanction} from "@/models/Profile.ts";
import {EmbedMessage} from "../lib/types.ts";

interface User {
    id: string
    name: string
    image: string
}

interface IProfile {
    discordId: string;
    permissions: number;
    flags: number;
    sanction: Sanction;
}

interface Reaction {
    emoji: string;
    users: User[];
}

const EmbedAuthor: Schema = new Schema({
    name: { type: String, required: false },
    icon_url: { type: String, required: false },
    url: { type: String, required: false }
})

const EmbedThumbnail: Schema = new Schema({
    url: { type: String, required: false }
})


const EmbedField: Schema = new Schema({
    name: { type: String },
    value: { type: String },
    inline: { type: String, default: false }
})

const EmbedImage: Schema = new Schema({
    url: { type: String, required: false }
})


const EmbedFooter: Schema = new Schema({
    text: { type: String, required: false },
    icon_url: { type: String, required: false }
})

const EmbedMessage: Schema = new Schema({
    color: { type: String, required: true },
    title: { type: String, required: false },
    url: { type: String, required: false },
    author: { type: EmbedAuthor, required: false },
    description: { type: String, required: false },
    thumbnail: { type: EmbedThumbnail, required: false, default: {} },
    fields: { type: [EmbedField], required: false, default: [] },
    image: { type: EmbedImage, required: false, default: {} },
    timestamp: { type: String, required: false },
    footer: { type: EmbedFooter, required: false, default: {} }
});

export interface IRepliedMessage {
    _id: string;
    streamId: string;
    content?: string;
    command?: string;
    type: 'user' | 'system' | 'gif' | 'bot' | 'reply' | 'command';
    user: User;
    author?: User;
    profile: IProfile;
    timestamp: number;
    reactions: Reaction[];
    embeds?: EmbedMessage[];
}

export interface IMessage {
    _id: string;
    streamId: string;
    content?: string;
    command?: string;
    type: 'user' | 'system' | 'gif' | 'bot' | 'reply' | 'command';
    user: User;
    author?: User;
    profile: IProfile;
    timestamp: number;
    reactions: Reaction[];
    embeds?: EmbedMessage[];
    repliedMessage?: IRepliedMessage;
}

const UserSchema: Schema = new Schema({
    id: { type: String },
    name: { type: String },
    image: { type: String },
});

const ProfileSchema: Schema = new Schema({
    discordId: {
        type: String,
        unique: true
    },
    permissions: {
        type: Number,
        default: 0
    },
    flags: {
        type: Number,
        default: 1
    },
    sanction: {
        type: {
            mute: {
                streamId: String,
                reason: String
            },
            ban: {
                issuer: String,
                reason: String
            }
        },
        default: {}
    }
});

const ReactionSchema: Schema = new Schema({
    emoji: { type: String },
    users: { type: [UserSchema] },
});

const RepliedMessageSchema: Schema = new Schema({
    streamId: { type: String, required: false },
    content: { type: String, required: false },
    command: { type: String, required: false },
    type: { type: String, enum: ['user', 'system', 'gif', 'bot', 'reply', 'command'], required: false },
    user: { type: UserSchema, required: false },
    author: { type: UserSchema, required: false },
    profile: { type: ProfileSchema, required: false },
    timestamp: { type: Number, required: false },
    reactions: { type: [ReactionSchema], default: [] },
    embeds: { type: [EmbedMessage], default: [] }
});


const MessageSchema: Schema = new Schema({
    streamId: { type: String, required: true },
    content: { type: String, required: false },
    command: { type: String, required: false },
    type: { type: String, enum: ['user', 'system', 'gif', 'bot', 'reply', 'command'], required: true },
    user: { type: UserSchema, required: true },
    author: { type: UserSchema, required: false },
    profile: { type: ProfileSchema, required: true },
    timestamp: { type: Number, required: true },
    reactions: { type: [ReactionSchema], default: [] },
    embeds: { type: [EmbedMessage], default: [] },
    repliedMessage: { type: RepliedMessageSchema, default: {}, required: false }
});

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
