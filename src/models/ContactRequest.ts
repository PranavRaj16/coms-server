import mongoose, { Document, Schema } from 'mongoose';

export interface IContactRequest extends Document {
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'Pending' | 'Read' | 'Replied';
}

const contactRequestSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Read', 'Replied'],
        default: 'Pending',
    }
}, {
    timestamps: true,
});

const ContactRequest = mongoose.model<IContactRequest>('ContactRequest', contactRequestSchema);

export default ContactRequest;
