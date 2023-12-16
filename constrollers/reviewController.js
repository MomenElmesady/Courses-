const Course = require("../models/coursesModel")
const Purchase = require("../models/PurchasesModel")
const appError = require("../utils/appError")
const Review = require("../models/reviewModel")
const catchAsync = require("../utils/catchAsync")

exports.getAllReviews = catchAsync(async (req,res,next)=>{
    const reviews = await Review.find()
    res.status(200).json({
        status: "success",
        data: {reviews}
    })
})

exports.createReview = catchAsync(async(req,res,next)=>{
    req.body.user = req.user._id
    const review = await Review.create(req.body)
    res.status(200).json({
        status: "success",
        data: {review}
    })
})

exports.checkRestrict = catchAsync(async(req,res,next)=>{
    const purchase = await Purchase.find({user:req.user._id,course:req.body.course})
    if (purchase.length == 0){
        return(next(new appError("you must have course to review it")))
    }
    next()
})  