const mongoose = require("mongoose");
const Schema = mongoose.Schema

const CoinSchema = new Schema({
    numistaNumber: {
        type: String,
        default: "",
        trim: true,
    },
    year: {
        type: String,
        trim: true,
    },
    issuer: {
        type: String,
        trim: true,
    },
    denomination: {
        type: String,
        trim: true,
    },
    grade: {
        type: String,
        trim: true,
    },
    gradeDetails: {
        type: String,
        trim: true,
    },
    details: {
        type: String,
        trim: true,
    },
    reference: {
        type: String,
        trim: true,
    },
    composition: {
        type: String,
        trim: true,
    },
    physicalDetails: {
        type: String,
        trim: true,
    },
    mintage: {
        type: String,
        trim: true,
    },
    dateAdded: {
        type: String,
        default: new Date().toISOString(),
        trim: true,
    },
    marksPicture: {
        type: String,
        trim: true,
    },
    marks: {
        type: Array,
        default: [],
    },
    visualTarget: {
        type: String,
        enum: ['QR', 'OBVERSE', 'REVERSE', 'PASTED', 'GALLERY'],
        default: 'QR',
    },
    visualMethod: {
        type: String,
        enum: ['SCRIPT', 'AI', 'RAW'],
        default: 'SCRIPT',
    },
    sketchId: {
        type: String,
        trim: true,
    },
    isManual: {
        type: Boolean,
        default: false,
    },
    cached: {
        type: Boolean,
        default: false,
    },

    // Per-label theme/layout (optional, overrides user default)
    labelTheme: {
        type: String,
        trim: true,
        default: undefined // If not set, use user's default
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

const Coin = mongoose.model("Coin", CoinSchema)

module.exports = Coin
