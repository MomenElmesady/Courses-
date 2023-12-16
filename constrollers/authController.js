const catchAsync = require("../utils/catchAsync");
const User = require("../models/usresModel");
const appError = require("../utils/appError");
const sendEmail = require("../utils/email")
const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
const {promisify} = require("util")

const createToken = async (id) => {
    return await jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

const createAndSendToken = async(user,statusCode,res)=>{
    const refreshToken = await createToken(user._id)
    res.cookie("refreshToken",refreshToken,{
        expired: new Date(Date.now()+30*60*60*1000),
        httpOnly: true 
    })
    await User.findByIdAndUpdate(user._id,{refreshToken},{new:true})
    const accessToken = await createToken(user._id)
    res.status(200).json({user,accessToken})
}

exports.register = catchAsync(async(req,res,next)=>{
    const {firstName,lastName,email,password,role} = req.body 
    const isEmailFound = await User.findOne({email})
    if (isEmailFound){
        return next(new appError("this email already used"))
    }
    const user = await User.create({firstName,lastName,email,password,role})
    createAndSendToken(user,200,res)
})

exports.login = catchAsync(async(req,res,next)=>{
    const {email,password} = req.body
    if (!email || !password){
        return next(new appError("should input email and password"))
    }
    const user = await User.findOne({email})
    if (!user){
        return next(new appError("There is no user with this email"))
    }
    const isPasswordMatch = await bcrypt.compare(password,user.password)
    if (!isPasswordMatch){
        return next(new appError("Wrong password"))
    }
    createAndSendToken(user,200,res)
})

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1]
        //  postman test 
        if (token === "false"){
            token = false 
        }
    }
    // 2) Verification token
    // if error in verfication it will pass error else verfiation executed successfully
    try{
        var decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); /*extract data*/
    }catch(err){
        return next(new appError("invalid token"))
    }
    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id)
    if (!freshUser.refreshToken){
        return next(new appError("must be logged in", 400))
    }
    if (!freshUser) {
        return next(new appError("This user dosent longer exists", 400))
    }
    // if success
    req.user = freshUser
    res.locals.user = freshUser;
    next()
})

exports.logout = catchAsync(async(req,res,next)=>{
    if (!req.cookies?.refreshToken){
        return next(new appError("Should send refresh token in cookie",400))
    }
    const refreshToken = req.cookies?.refreshToken 
    const user = await User.findOne({refreshToken})
    if (user){
        await User.findByIdAndUpdate(user._id,{refreshToken: ""})
    }
    
    res.cookie("refreshToken",false,{
        expired: new Date(Date.now()+5*1000),
        httpOnly: true 
    })
    res.status(200).json({
        status: "success"
    })
})
exports.refreshToken = catchAsync(async(req,res,next)=>{
    if (!req.cookies?.refreshToken){
        return next(new appError("Should send refresh token in cookie",400))
    }
    const refreshToken = req.cookies?.refreshToken 
    const user = await User.findOne({refreshToken})
    try {
        await promisify(jwt.verify)(user?.refreshToken,process.env.JWT_SECRET)
    }catch(err){
        return next(new appError("invalid token",400))
    }
    const accessToken = await createToken(user._id)
    res.status(200).json({accessToken})
})
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new appError("cant find this email", 403))
    }
    const resetToken = user.createPasswordResetToken()

    await user.save({ validateBeforeSave: false })

    try {
        await sendEmail({ email: user.email, subject: `your Password reset token (for 10 minutes)`, resetToken })
        res.status(200).json({
            status: `success`,
            message: `token send to email`
        })
    } catch (err) {
        user.paswordResetToken = undefined
        user.paswordResetExpires = undefined
        await user.save({ validateBeforeSave: false })
        return next(new appError("there was an error sending the email , try again", 500))
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex")
    const user = await User.findOne({ passwordResetToken: hashedToken })

    if (!user) {
        return next(new appError("Token has invalid or expired", 400))
    }
    user.password = req.body.password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    const token = await createToken(user._id)
    res.json({ status: "success", data: { user }, token })

})

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = req.user
    const isPasswordMatch = await bcrypt.compare(req.body.currentPassword, user.password)
    if (!isPasswordMatch) {
        return next(new appError("Wrong password"))
    }
    
    user.password = req.body.password
    await user.save()

    const token = await createToken(user._id)
    res.json({ status: "success", data: { user }, token })

})