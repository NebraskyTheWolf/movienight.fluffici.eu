const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContentRatingSchema = new Schema({
    age: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    }
}, { _id : false });

const StreamSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    contentRating: {
        type: ContentRatingSchema,
        required: true,
    },
    streamId: {
        type: String,
        required: true
    }
});

const Stream = mongoose.models.Stream || mongoose.model('Stream', StreamSchema);

module.exports = Stream;
