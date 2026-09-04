const mongoose = require("mongoose");
const Schema = mongoose.Schema

const CoinSchema = new Schema({
    numistaNumber: {
        type: String,
        default: "",
        trim: true,
    },
    ocreId: {
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
        enum: ['QR', 'OBVERSE', 'REVERSE', 'PASTED', 'GALLERY', 'LEGENDS'],
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
    legendObv: {
        type: String,
        trim: true,
        default: "",
    },
    legendRev: {
        type: String,
        trim: true,
        default: "",
    },
    isCollectionItem: {
        type: Boolean,
        default: false,
    },
    collectionObvImage: {
        type: String,
        default: "",
    },
    collectionRevImage: {
        type: String,
        default: "",
    },
    isManual: {
        type: Boolean,
        default: false,
    },
    hasLabel: {
        type: Boolean,
        default: true,
    },
    cached: {
        type: Boolean,
        default: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true })

const Coin = mongoose.model("Coin", CoinSchema)

module.exports = Coin
