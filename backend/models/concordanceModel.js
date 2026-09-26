const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// RIC -> RSC/BMC concordance rows swept from WildWinds' per-emperor RIC
// pages (see scripts/sweepWildwindsConcordance.js). One row per entry block
// on the page; `rowIndex` keeps multiple rows for the same RIC number in
// page order (e.g. aureus and denarius listings).
const ConcordanceSchema = new Schema({
    emperor: {
        type: String,
        required: true,
        trim: true,
    },
    number: {
        type: String,
        required: true,
        trim: true,
    },
    volume: {
        type: String,
        default: "",
        trim: true,
    },
    rowIndex: {
        type: Number,
        default: 0,
    },
    // Cross-reference numbers as shown on WildWinds ("405", "43a", "534-40",
    // "M766"). Empty when the entry lists none. Sear is a fallback reference
    // used only when BMC is missing.
    rsc: {
        type: [String],
        default: [],
    },
    bmc: {
        type: [String],
        default: [],
    },
    sear: {
        type: [String],
        default: [],
    },
    heading: {
        type: String,
        default: "",
    },
    sourceUrl: {
        type: String,
        default: "",
    },
    fetchedAt: {
        type: Date,
        default: Date.now,
    },
});

ConcordanceSchema.index({ emperor: 1, number: 1, rowIndex: 1 }, { unique: true });

const Concordance = mongoose.model("Concordance", ConcordanceSchema);

module.exports = Concordance;
