const mongoose = require("mongoose");
const validator = require('validator');
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "first name required"],
    },
    lastName: {
        type: String,
        required: [true, "last name required"],
    },
    email: {
        type: String,
        required: [true, "email required"],
        unique: true,
        validate: [validator.isEmail, "email should be valid"]
    },
    password: {
        type: String,
        required: [true, "password required"],
    },
    refreshToken:{
        type: String,
        default: "",
        unique: true
    },
    role: {
        type: String,
        enum: ["admin", "user", "teacher"],
        default: "user"
    },
    avatar: {
        type: String,
        default: "uploads/profile.png"
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// you can use save as you want if you change password it will change here 
userSchema.pre("save", async function (next) {
    // this line becouse if you save without changing password -> dont changeit in database (like if we exec forgotPassword and dont exec resetPassword we shouldnt change it)
    if (!this.isModified('password'))
        return next();
    this.password = await bcrypt.hash(this.password, 12)
    next()
})

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
}
userSchema.methods.createEmailVerificationToken = async function () {
    const verificationToken = await jwt.sign({ email: this.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
    this.verificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    return verificationToken;
}

module.exports = mongoose.model("User", userSchema);
