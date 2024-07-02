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
    url: { type: String, required: true },
    value: { type: String, required: true },
    inline: { type: String, required: false, default: false }
})

const EmbedImage: Schema = new Schema({
    url: { type: String, required: false }
})


const EmbedFooter: Schema = new Schema({
    text: { type: String, required: false },
    icon_url: { type: String, required: false }
})

const EmbedMessage: Schema = new Schema({
    color: { type: Number, required: true },
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

export interface IMessage {
    _id: string;
    streamId: string;
    content: string;
    type: 'user' | 'system' | 'gif' | 'bot';
    user: User;
    profile: IProfile;
    timestamp: number;
    reactions: Reaction[];
    embeds: EmbedMessage[];
}

const UserSchema: Schema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
});

const ProfileSchema: Schema = new Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    permissions: {
        type: Number,
        required: true,
        default: 0
    },
    flags: {
        type: Number,
        required: true,
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
        required: false,
        default: {}
    }
});

const ReactionSchema: Schema = new Schema({
    emoji: { type: String, required: true },
    users: { type: [UserSchema], required: true },
});

const MessageSchema: Schema = new Schema({
    streamId: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['user', 'system'], required: true },
    user: { type: UserSchema, required: true },
    profile: { type: ProfileSchema, required: true },
    timestamp: { type: Number, required: true },
    reactions: { type: [ReactionSchema], default: [] },
    embeds: { type: [EmbedMessage], default: [] },
});

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
