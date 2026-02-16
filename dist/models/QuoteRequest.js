import mongoose, { Schema } from 'mongoose';
const quoteRequestSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    workEmail: {
        type: String,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    firmName: {
        type: String,
        required: true,
    },
    firmType: {
        type: String,
        required: true,
    },
    requiredWorkspace: {
        type: String,
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    additionalRequirements: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Closed'],
        default: 'Pending',
    }
}, {
    timestamps: true,
});
const QuoteRequest = mongoose.model('QuoteRequest', quoteRequestSchema);
export default QuoteRequest;
