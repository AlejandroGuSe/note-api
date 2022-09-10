const mongoose = require('mongoose')

// Define the note's database schema
const noteSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        favoriteCount: {
            type: Number,
            default: 0
        },
        favoritedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        //Assigns createdAt and updatedAt fields with a Data type
    timestamps: true
    }
)

// Define the 'Note' model with the shema
const Note = mongoose.model('Note', noteSchema)

module.exports = Note
