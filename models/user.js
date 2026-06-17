const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {ROLES, DEFAULT_ROLE} = require('../lib/constants');


const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

const userSchema = new mongoose.Schema(
    {
        userId:{
            type: Number,
            unique:true,
        },
        email: {
            type: String,
            unique: true,
            required: [true, "Email is required"],
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"]
        },
        businessName: {
            type: String,
            required: [true, "Business name is required"]
        },
        role: {
            type: String,
            enum: ROLES,
            default: DEFAULT_ROLE
        },
        isActive: {
            type: Boolean,
            default: true
        },
    },
    {timestamps: true}
);

//* Autoincrement id
userSchema.pre('save', async function (next) {
    if (!this.isNew) return next();
    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'userId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.userId = counter.seq;
        next();
    } catch (err) {
        next(err);
    }
});

//* Hash pwd
userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    try{
        const hashedPwd = await bcrypt.hash(this.password, 10);
        this.password = hashedPwd;
        next();
    }
    catch(err){
        next(err);
    }
})

//* Compare pwds
userSchema.methods.comparePassword = async function(userPassword) {
    return bcrypt.compare(userPassword, this.password);
}

const User = mongoose.model("User", userSchema);

module.exports = User;