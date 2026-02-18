import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingRequest extends Document {
    workspaceId: string;
    workspaceName: string;
    fullName: string;
    email: string;
    contactNumber: string;
    firmName: string;
    duration: string;
    startDate: Date;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
}

const bookingRequestSchema: Schema = new Schema({
    workspaceId: {
        type: String,
        required: true,
    },
    workspaceName: {
        type: String,
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    firmName: {
        type: String,
    },
    duration: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
        default: 'Pending',
    }
}, {
    timestamps: true,
});

const BookingRequest = mongoose.model<IBookingRequest>('BookingRequest', bookingRequestSchema);

export default BookingRequest;
