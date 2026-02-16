import Workspace from './models/Workspace.js';
import User from './models/User.js';
import QuoteRequest from './models/QuoteRequest.js';
import ContactRequest from './models/ContactRequest.js';
import connectDB from './config/db.js';

const workspaces = [
    {
        name: "Dedicated Workspace #1",
        location: "Whitefields, Kondapur",
        floor: "1st Floor",
        type: "Dedicated Workspace",
        capacity: "20 people",
        amenities: ["High-speed WiFi", "Coffee Bar", "24/7 Access"],
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format",
        featured: true,
        price: "From ₹9,999/mo",
        features: {
            hasConferenceHall: true,
            hasCabin: true
        }
    },
    {
        name: "Open Workstation",
        location: "Whitefields, Kondapur",
        floor: "2nd Floor",
        type: "Open WorkStation",
        capacity: "6-12 people",
        amenities: ["High-speed WiFi", "Coffee Bar", "Presentation Room"],
        image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&auto=format",
        featured: false,
        price: "From ₹5,999/mo"
    },
    {
        name: "Executive Meeting Room",
        location: "JBS Parade Ground",
        floor: "1st Floor",
        type: "Board Room",
        capacity: "12 people",
        amenities: ["High-speed WiFi", "Coffee Bar", "Smart Board"],
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format",
        featured: false,
        price: "From ₹799/hr"
    },
    {
        name: "Grand Event Space",
        location: "Whitefields, Kondapur",
        floor: "4th Floor",
        type: "Event Space",
        capacity: "100-120 people",
        amenities: ["AV Equipment", "Catering Available", "Parking"],
        image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&auto=format",
        featured: false,
        price: "Contact for Pricing"
    },
    {
        name: "Private Suite",
        location: "JBS Parade Ground",
        floor: "5th Floor",
        type: "Dedicated Workspace",
        capacity: "4 people",
        amenities: ["Private Entry", "WiFi", "Printer Access"],
        image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format",
        featured: true,
        price: "From ₹24,999/mo",
        features: {
            hasConferenceHall: false,
            hasCabin: true
        }
    },
    {
        name: "Creative Studio",
        location: "Whitefields, Kondapur",
        type: "Open Workspace",
        capacity: "8 people",
        amenities: ["Natural Light", "Studio Backgrounds", "Coffee"],
        image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&auto=format",
        featured: false,
        price: "From ₹12,999/mo"
    }
];

const users = [
    {
        name: "Pranav Raj",
        email: "pranav@cohort.com",
        password: "password123",
        role: "Admin",
        status: "Active",
        joinedDate: "2024-01-15",
        lastActive: "Today",
    },
    {
        name: "Amit Sharma",
        email: "amit@startup.co",
        password: "password123",
        role: "Member",
        status: "Active",
        joinedDate: "2024-02-10",
        lastActive: "2 hours ago",
    },
    {
        name: "Sneha Reddy",
        email: "sneha@designhub.in",
        password: "password123",
        role: "Member",
        status: "Inactive",
        joinedDate: "2023-11-20",
        lastActive: "5 days ago",
    },
    {
        name: "Vikram Malhotra",
        email: "vikram@enterprise.com",
        password: "password123",
        role: "Manager",
        status: "Active",
        joinedDate: "2024-03-01",
        lastActive: "10 mins ago",
    }
];

const importData = async () => {
    try {
        await connectDB();

        await Workspace.deleteMany();
        await User.deleteMany();
        await QuoteRequest.deleteMany();
        await ContactRequest.deleteMany();

        await Workspace.insertMany(workspaces);
        await User.create(users);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error('Error with data import:');
        console.error(error);
        process.exit(1);
    }
};

importData();
