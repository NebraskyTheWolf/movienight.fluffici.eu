import mongoose, { Document, Model, Schema } from 'mongoose';


interface Mute {
    streamId: string;
    reason: string;
}

interface Ban {
    issuer: string;
    reason: string;
}

export interface Sanction {
    mute?: Mute;
    ban?: Ban;
}

export interface IProfile {
    discordId: string;
    permissions: number;
    flags: number;
    sanction: Sanction;
    streamKey?: string;
}

const ProfileSchema: Schema = new Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    permissions: {
        type: Number,
        required: true,
        default: 3713
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
    },
    streamKey: {
        type: String,
        default: null
    }
});

const Profile: Model<IProfile> = mongoose.models.Stream || mongoose.model<IProfile>('Profile', ProfileSchema);

export default Profile;
