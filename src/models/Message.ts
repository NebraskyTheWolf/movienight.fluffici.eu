import mongoose, { Schema, Document, Model } from 'mongoose';
import {Sanction} from "@/models/Profile.ts";

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

export interface IMessage {
    _id: string;
    streamId: string;
    content: string;
    type: 'user' | 'system';
    user: User;
    profile: IProfile;
    timestamp: number;
    reactions: Reaction[];
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
});

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
