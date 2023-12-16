const User = require("../models/usresModel")
const Course = require("../models/coursesModel")
const appError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { promisify } = require('util')
const Purchase = require("../models/PurchasesModel")


const createToken = async(id)=>{
    return await jwt.sign({id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN})
}


exports.getAllUsers = catchAsync(async (req, res, next) => {
    const query = req.query 
    const page = (query.page || 1) *1 
    const limit = (query.limit || 10) *1 
    const skip = (limit*(page-1)) *1 
    const users = await User.find({},{__v:false}).limit(limit).skip(skip)
    res.json({ status: "success", data: { users } })
})

exports.getUser = catchAsync(async(req,res,next)=>{
    const user = await User.findById(req.params.userId)
    res.status(200).json({user})

})

exports.getTeacherCourses = catchAsync(async(req,res,next)=>{
    const teacher = await User.findById(req.params.teacherId)

    if (!teacher){
        return next(new appError("there is no user with this id",403))
    }
    if (teacher.role != "teacher"){
        return next(new appError("this is not teacher",403))
    }
    const courses = await Course.find({teacher: req.params.teacherId})

    res.status(200).json({
        status: "success",
        data:{
            courses
        }
    })
})

exports.getUserCourses = catchAsync(async(req,res,next)=>{
    const user = await User.findById(req.params.userId)
    if (!user){
        return next(new appError("there is no user with this id",403))
    }
    if (user.role != "user"){
        return next(new appError("this is not user",403))
    }
    const courses = await Purchase.find({user: req.params.userId}).select("course").populate("course")
    res.status(200).json({
        status: "success",
        data:{
            courses
        }
    })
})

exports.buy = (async(req,res,next)=>{
    let user = await User.findById(req.user._id)
    if (user.cart.length === 0){
        return next(new appError("The Cart Is Empty"))
    }
    for (i of user.cart){
        
        var purchase = await Purchase.create({
            user: user._id,
            course: i ,
            price: 0
        })
    }
    await User.findByIdAndUpdate(user._id,{cart:[]})
    res.status(200).json({
        status: "success",
        purchase
    })
})

exports.showCart = catchAsync(async(req,res,next)=>{
    const user = await User.findById(req.user._id)
    res.status(200).json({
        cart: user.cart 
    })
})

