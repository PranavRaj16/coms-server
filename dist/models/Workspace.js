import mongoose, { Schema } from 'mongoose';
const workspaceSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    floor: {
        type: String,
    },
    type: {
        type: String,
        required: true,
    },
    capacity: {
        type: String,
        required: true,
    },
    amenities: {
        type: [String],
        default: ['High-speed WiFi', 'Coffee Bar'],
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format',
    },
    featured: {
        type: Boolean,
        default: false,
    },
    price: {
        type: String,
        default: 'Contact for Pricing',
    },
    features: {
        hasConferenceHall: {
            type: Boolean,
            default: false,
        },
        hasCabin: {
            type: Boolean,
            default: false,
        }
    }
}, {
    timestamps: true,
});
const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
