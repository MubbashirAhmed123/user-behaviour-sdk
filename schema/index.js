import mongoose from "mongoose";

const mouseMovement = new mongoose.Schema({
    x: Number,
    y: Number,
    timestamp: Date,
    speed: Number
}, { _id: false });

const metaSchema = new mongoose.Schema({
    text: String,
    tag: String,
    mouseMovement: [mouseMovement],
    wordSpeed: Number,
    characterSpeed: Number,
    loginStatus: String,
    pathname: String,
    href: String,
    amount: Number,
    transactionType: String,
    status: String,
    password: String,
    email: String,
}, { _id: false });

const locationSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number
}, { _id: false });

const userEventSchema = new mongoose.Schema({
    uId: String,
    type: {
        type: String,
        enum: ['CLICK', 'MOUSE_MOVE', 'TYPING_SPEED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'NAVIGATION', 'DEVICE_DETAILS', 'TRANSACTION_PATTERNS', 'ACCOUNT_ACTIVITY'],
        required: true
    },
    timestamp: { type: Date, required: true },
    sessionId: { type: String, required: true },
    location: locationSchema,
    deviceDetails: { type: Object },
    meta: metaSchema
}, { timestamps: true });




const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    fingerprintUid: { type: String, required: true },
    customUid: String,
    uId: String,
    location: locationSchema,
    ip: String,
    deviceDetails: Object,
    startTime: Date,
    endTime: Date,
}, { timestamps: true });


 const dayWiseDataSchema = new mongoose.Schema({

  uId: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true // Format: YYYY-MM-DD
  },
  mouseMovement: {
    averageSpeed: Number,
    count: Number
  },
  loginAttempts: {
    total: Number,
    success: Number,
    failed: Number
  },
  sessions: {
    totalSessions: Number,
    totalEvents: Number
  },
  account: {
    totalAccounts: Number,
    totalUids: Number,
    totalUserAccounts: Array,
    totalDevices: Array,
  },
  typingSpeed: {
    avgWordSpeed: Number,
    avgCharacterSpeed: Number,
    count: Number
  },
  transaction: {
    avgAmount: Number,
    transactionCount: Number,
    totalAmount: Number
  },
  accountActivity: {
    count: Number
  },
  location: [locationSchema]
}, { timestamps: true });


// models/OverallUserStats.js

const OverallUserStatsSchema = new mongoose.Schema({
  uId: { type: String, required: true, unique: true },
  averageMouseSpeed: Number,
  totalMouseMoves: Number,

  totalLoginAttempts: Number,
  successfulLogins: Number,
  failedLogins: Number,

  totalSessions: Number,
  totalEvents: Number,

  totalAccounts: Number,
  totalUids: Number,
  totalUserAccounts: Array,
  totalDevices: Array,

  averageWordSpeed: Number,
  averageCharacterSpeed: Number,
  totalTypingEntries: Number,

  averageTransactionAmount: Number,
  totalTransactionCount: Number,
  totalTransactionAmount: Number,

  totalAccountActivities: Number,
  location:[locationSchema],
  calculatedAt: { type: Date, default: Date.now }
});

export const OverallStats = mongoose.model("OverallUserStats", OverallUserStatsSchema);


export const DailyUserStats = mongoose.model('DailyUserStats', dayWiseDataSchema);

    


export const UserEvent = mongoose.model("UserEvent", userEventSchema);
export const Session = mongoose.model("Session", sessionSchema);

export async function initDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/analytics', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}