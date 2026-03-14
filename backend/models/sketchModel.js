const mongoose = require('mongoose');

const SketchSchema = new mongoose.Schema({
    sourceHash: {
        type: String,
        index: true  // Hash of the source image for deduplication
    },
    numistaNumber: { 
        type: String,  // Optional metadata — which coin type originally generated this
        default: ''
    },
    year: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''  // User-friendly label for gallery display
    },
    side: {
        type: String,
        enum: ['OBVERSE', 'REVERSE', 'SKETCH', 'PASTED'],
        required: true
    },
    method: { 
        type: String, 
        enum: ['SCRIPT', 'AI', 'RAW'], 
        required: true 
    },
    imageData: { 
        type: String, 
        required: true 
    },
    contentType: { 
        type: String, 
        default: 'image/png' 
    },
    width: {
        type: Number,
        default: 520  // Default: 44mm at 300 DPI
    },
    height: {
        type: Number,
        default: 327  // Default: 27.7mm at 300 DPI (61% of 45.5mm)
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// --- THE FIFO GUARD ---
// Before saving a new sketch, check if we have too many. 
// If we have 60 or more, delete the oldest UNREFERENCED one.
SketchSchema.pre('save', async function(next) {
    const Sketch = this.constructor;
    const Coin = mongoose.model('Coin');
    const count = await Sketch.countDocuments();
    
    if (count >= 60) {
        // Find the oldest sketches and delete the first one not referenced by any coin
        const oldestSketches = await Sketch.find().sort({ createdAt: 1 }).limit(10);
        for (const sketch of oldestSketches) {
            const refCount = await Coin.countDocuments({ sketchId: sketch._id.toString() });
            if (refCount === 0) {
                await Sketch.findByIdAndDelete(sketch._id);
                console.log(`Auto-pruned unreferenced sketch: ${sketch._id}`);
                break;
            }
        }
    }
    next();
});

module.exports = mongoose.model('Sketch', SketchSchema);