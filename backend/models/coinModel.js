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
    mass: {
        type: String,
        trim: true,
    },
    diameter: {
        type: String,
        trim: true,
    },
    orientation: {
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
})

const Coin = mongoose.model("Coin", CoinSchema)

module.exports = Coin
