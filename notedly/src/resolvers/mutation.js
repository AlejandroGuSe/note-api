const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const {
    AuthenticationError,
    ForbiddenError
} = require('apollo-server-express')
require('dotenv').config()


const gravatar = require('../util/gravatar')

module.exports = {
    newNote: async (parent, args, { models, user }) => {
        // if there is no user on the context, throw an authentication error
        if(!user) {
            throw new AuthenticationError('You must be signed in to create a note')
        }

        return await models.Note.create({
            content: args.content,
            author: mongoose.Types.ObjectId(user.id)
        })
    },
    deleteNote: async (parent, { id }, { models, user }) => {
        // if there is no user on the context, throw an authentication error
        if(!user) {
            throw new AuthenticationError('You must be signed in to create a note')
        }

        //find the note
        const note = await models.Note.findById(id)
        // if the note owner and currect user don't match, throw a forbidden error
        if(note && String(note.author) !== user.id){
            throw new ForbiddenError("You don't have permission to delete the note")
        } 

        try {
            await note.remove()
            return true
        } catch (err) {
            return false
        }
    },
    updateNote: async (parent, { content, id }, { models, user }) => {
        // if there is no user on the context, throw an authentication error
        if(!user) {
            throw new AuthenticationError('You must be signed in to create a note')
        }

        //find the note
        const note = await models.Note.findById(id)
        // if the note owner and currect user don't match, throw a forbidden error
        if(note && String(note.author) !== user.id){
            throw new ForbiddenError("You don't have permission to delete the note")
        }

        return await models.Note.findOneAndUpdate(
            {
                _id: id
            },
            {
                $set: {
                    content
                }
            },
            {
                new: true
            }
        );
    },
    signUp: async (parent, { username, email, password }, { models }) => {
            // normalize email address
            email = email.trim().toLowerCase()
            // hash the password
            const hashed = await bcrypt.hash(password, 10)
            // create the gravatar url
            const avatar = gravatar(email)
        try{
            const user = await models.User.create({
                username,
                email, 
                avatar,
                password: hashed
            }) 

           //create and return the json web token
           return jwt.sign({ id: user._id}, process.env.JWT_SECRET)
        } catch (err) {
            console.log(err)

            throw new Error('Error creating account')
        }
    },
    signIn: async (parent, { username, email, password }, { models }) => {
        if(email){
            // normalize email address
            email = email.trim().toLowerCase()
        }        

        const user = await models.User.findOne({
            $or: [{ email }, { username }]
        })

        //if not user is found, throw an authentication error
        if(!user){
            throw new AuthenticationError("Error signing in")
        }

        //if the password don't match, throw an authentication error
        const valid = await bcrypt.compare(password, user.password)
        if(!valid){
            throw new AuthenticationError("Error signing in")
        }

        // create and return the json web token
        return jwt.sign({ id: user._id} , process.env.JWT_SECRET)
    },
    toggleFavorite: async (parent, { id }, { models, user }) => {
        // if no user context is passed, throw author error
        if(!user){
            throw new AuthenticationError()
        }
        // check to see if the user has already favorited the note
        let noteCheck = await models.Note.findById(id)
        const hasUser = noteCheck.favoritedBy.indexOf(user.id)
       
        console.log(hasUser+" "+id+" "+noteCheck.favoriteCount+" hello ")
        // if the user exists in the list
        // pull them from the list and reduce the favoriteCount by 1
        if(hasUser >= 0){
            return await models.Note.findOneAndUpdate(
                id,
                {
                    $pull: {
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    $inc: {
                        favoriteCount: -1
                    }
                },
                {
                    // Set new to true to return the update doc    
                    new: true
                }
            )
        } else {
            return await models.Note.findOneAndUpdate(
                id,
                {
                    $push: {
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    $inc: {
                        favoriteCount: 1
                    }
                },
                {
                    // Set new to true to return the update doc    
                    new: true
                }
            )
        }
    } 
}