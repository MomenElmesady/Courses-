const Purchase = require("../models/PurchasesModel")
const Course = require("../models/coursesModel")
const User = require("../models/usresModel")
const appError = require("../utils/appError")

const catchAsync = require("../utils/catchAsync")

exports.getAllCourses = catchAsync(async (req, res, next) => {
    let coursesQuery = Course.find()
    const copyQuery = { ...req.query }
    const execludedFields = ["page", "sort", "limit", "fields"];
    execludedFields.forEach(el => delete copyQuery[el]);
    console.log(copyQuery)
    coursesQuery = coursesQuery.find(copyQuery)

    if (req.query.sort) {
        let sortBy = req.query.sort.replaceAll(",", " ")
        coursesQuery = coursesQuery.sort(sortBy)
    }
    else {
        coursesQuery = coursesQuery.sort("-ratingAverage")
    }

    if (req.query.fields) {
        let fields = req.query.fields.replaceAll(",", " ")
        fields = fields + " -_id"
        coursesQuery = coursesQuery.select(fields)
    } else {
        coursesQuery = coursesQuery.select("-__v")
    }

    const page = req.query.page * 1 || 1
    const limit = req.query.limit * 1 || 100
    const skip = (page - 1) * limit
    coursesQuery = coursesQuery.skip(skip).limit(limit)

    const courses = await coursesQuery

    // const courses = await Course.find({},{__v:false}).limit(limit).skip(skip).populate({path:"teacher",select: "firstName lastName avatar "})
    res.json({ status: "success", data: { courses } })
})

exports.createCourse = catchAsync(async (req, res, next) => {
    const course = await Course.create(req.body)
    res.json(course)
})

exports.getCourse = catchAsync(async (req, res, next) => {
    const course = await Course.findById(req.params.courseId).populate("reviews").populate({
        path: "teacher",
        select: "firstName lastName avatar"
    })
    if (!course) {
        return next(new appError("course not found!", 404))
    }
    res.json({ status: "success", data: { course } })
})

exports.updateCourse = catchAsync(async (req, res, next) => {
    const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true })
    if (!course) {
        return next(new appError("course not found!", 404))
    }
    res.json({ status: "success", data: { course } })
})
exports.deleteCourse = catchAsync(async (req, res, next) => {
    const course = await Course.findByIdAndDelete(req.params.courseId, req.body)
    if (!course) {
        return next(new appError("course not found!", 404))
    }
    res.json({
        status: "success",
        data: null
    })
})

exports.like = catchAsync(async (req, res, next) => {
    const course = await Course.findById(req.params.courseId)
    
    const likes = course.likes
    if (likes.includes(req.user._id)) {
        likes.splice(likes.indexOf(req.user._id), 1);
    }
    else {
        likes.push(req.user._id)
    }
    course.likes = likes
    course.save()
    res.status(200).json({
        status: "success",
        data: course
    })
})
exports.disLike = catchAsync(async (req, res, next) => {
    const course = await Course.findById(req.params.courseId)
    const disLikes = course.disLikes
    if (disLikes.includes(req.user._id)) {
        disLikes.splice(disLikes.indexOf(req.user._id), 1);
    }
    else {
        disLikes.push(req.user._id)
    }
    course.disLikes = disLikes
    course.save()
    res.status(200).json({
        status: "success",
        data: course
    })
})


exports.addToCart = catchAsync(async (req, res, next) => {
    let user = await User.findById(req.user._id)
    const cart = user.cart
    const checkDuplicate = await Purchase.findOne({user:user._id,course:req.params.courseId})
    if (checkDuplicate) {
        return next(new appError("you bought this cours"))
    }
    if (cart.includes(req.params.courseId)) {
        return next(new appError("you add this cours"))
    }
    cart.push(req.params.courseId)
    user = await User.findByIdAndUpdate(req.user._id, { cart }, { new: true })

    res.status(200).json({
        status: "success",
        data: {
            cart
        }
    })
})

exports.deleteFromCart = catchAsync(async (req, res, next) => {
    let user = await User.findById(req.user._id)
    const cart = user.cart
    const index = cart.indexOf(req.params.courseId)
    cart.splice(index, 1)
    user = await User.findByIdAndUpdate(req.user._id, { cart }, { new: true })

    res.status(200).json({
        status: "success",
        data: {
            cart
        }
    })
})
exports.searchByName = catchAsync(async (req, res, next) => {
    let coursesQuery = Course.find();

    if (req.query.name) {
        // Use a regular expression to match any substring containing req.query.name
        coursesQuery = coursesQuery.find({ title: { $regex: new RegExp(req.query.name, 'i') } });
    }

    coursesQuery.sort("-ratingAverage")

    const courses = await coursesQuery;

    res.status(200).json(courses);
});




exports.analysesCategories = (async (req, res, next) => {
    const categories = await Course.aggregate([
        {
            $group: {
                _id: "$category",
                numCourses: { $sum: 1 },
                ratingAverage: { $avg: "$ratingAverage" },
                maxPrice: { $max: "$price" },
                minPrice: { $min: "$price" },
            }
        },
        {
            $addFields: { category: "$_id" }
        },
        {
            $sort: { numCourses: -1 }
        },
        {
            $project: {
                _id: 0
            }
        },
    ])

    res.status(200).json(categories)
})

exports.getCoursesForCategory = catchAsync(async(req,res,next)=>{
    // const courses = await Course.find({category:req.params.category})
    const courses = await Course.aggregate([
        {
            $match: {
                category: req.params.category
            }
        }
    ])
    res.status(200).json({
        status: "succeed",
        data: courses
    })
})

exports.getTopTeachersForCategory = (async(req,res,next)=>{
    const teachers = await Course.find({category:req.params.category}).select("teacher -_id").populate("teacher")
    res.status(200).json({teachers})
})

exports.test = catchAsync(async(req,res,next)=>{
    const state = await Course.aggregate([
        {
            $match: {
                price: {$gte: 1000}
            }
        },
        {
            $project: {
                title: 1,
                price: 1,
                category: 1,
                _id: 0
            }
        },
        {
            $group: {
                _id: "$category",
                average: {$avg: "$price"},
                maxPrice: {$max: "$price"},
                lowPrice: {$min: "$price"},
            }
        },
        {
            $sort: {
                maxPrice: -1
            }
        },
        {
            $set: {
                category: "$_id"
            }
        },

    ])
    res.status(200).json(state)
})
