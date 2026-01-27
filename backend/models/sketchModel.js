const mongoose = require('mongoose');

const SketchSchema = new mongoose.Schema({
    numistaNumber: { 
        type: Number, 
        required: true 
    },
    year: {
        type: String,
        required: true
    },
    side: {
        type: String,
        enum: ['OBVERSE', 'REVERSE'],
        required: true
    },
    method: { 
        type: String, 
        enum: ['SCRIPT', 'AI'], 
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
// If we have 60 or more, delete the oldest one.
SketchSchema.pre('save', async function(next) {
    const Sketch = this.constructor;
    const count = await Sketch.countDocuments();
    
    if (count >= 60) {
        // Find the oldest document by sorting createdAt in ascending order (1)
        const oldest = await Sketch.findOne().sort({ createdAt: 1 });
        if (oldest) {
            await Sketch.findByIdAndDelete(oldest._id);
            console.log(`Auto-pruned oldest sketch: ${oldest._id}`);
        }
    }
    next();
});

module.exports = mongoose.model('Sketch', SketchSchema);