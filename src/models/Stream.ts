import mongoose, { Document, Model, Schema } from 'mongoose';

interface ContentRating {
    age: number;
    reason: string;
}

export interface IStream extends Document {
    title: string;
    description: string;
    contentRating: ContentRating;
    streamId: string;
}

const StreamSchema: Schema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    contentRating: {
        type: Object,
    },
    streamId: {
        type: String,
        required: true
    }
});

const Stream: Model<IStream> = mongoose.models.Stream || mongoose.model<IStream>('Stream', StreamSchema);

export default Stream;

//TODO: save all messages in database
