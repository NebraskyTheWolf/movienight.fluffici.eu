import mongoose, { Document, Model, Schema } from 'mongoose';

interface AutoModerationSettings {
    blacklist: string[];
    regexPatterns: string[];
}

export interface IChatSettings extends Document {
    enableChat: boolean;
    autoModeration: AutoModerationSettings;
}

const AutoModerationSchema: Schema = new Schema({
    blacklist: {
        type: [String],
        required: true,
        default: [],
    },
    regexPatterns: {
        type: [String],
        required: true,
        default: [],
    },
});

const ChatSettingsSchema: Schema = new Schema({
    enableChat: {
        type: Boolean,
        required: true,
        default: true,
    },
    autoModeration: {
        type: AutoModerationSchema,
        required: true,
        default: () => ({}),
    },
});

const ChatSettings: Model<IChatSettings> = mongoose.models.ChatSettings || mongoose.model<IChatSettings>('ChatSettings', ChatSettingsSchema);

export default ChatSettings;
