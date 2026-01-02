const mongoose = require("mongoose");
const Schema = mongoose.Schema

const CoinSchema = new Schema({
    numistaNumber: {
        type: String,
        required: true,
        trim: true,
    },
    year: {
        type: String,
        required: true,
        trim: true,
    },
    issuer: {
        type: String,
        required: true,
        trim: true,
    },
    denomination: {
        type: String,
        required: true,
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
})

const Coin = mongoose.model("Coin", CoinSchema)

module.exports = Coin
