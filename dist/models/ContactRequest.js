import mongoose, { Schema } from 'mongoose';
const contactRequestSchema = new Schema({
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
const ContactRequest = mongoose.model('ContactRequest', contactRequestSchema);
export default ContactRequest;
