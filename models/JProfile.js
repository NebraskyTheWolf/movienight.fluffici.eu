const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProfileSchema = new Schema({
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

const JProfile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

module.exports = JProfile;
