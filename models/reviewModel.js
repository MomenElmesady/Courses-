const mongoose = require("mongoose");
const Course = require("./coursesModel")
const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        required: [true, "Should have review"]
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    course: {
        type: mongoose.Schema.ObjectId,
        ref: "Course",
        required: [true, "Review must belong to a Course"]
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "Review must belong to a User "]
    }
},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

reviewSchema.statics.calcAveragrRating = async function (courseId) {
    const stats = await this.aggregate([
        {
            $match: { course: courseId }
        },
        {
            $group: {
                _id: "$course",
                nRatings: { $sum: 1 },
                avgRating: { $avg: "$rating" }
            }
        }
    ])
    
    if (stats.length > 0) {
        await Course.findByIdAndUpdate(courseId, {
            ratingQuantity: stats[0].nRatings,
            ratingAverage: stats[0].avgRating
        });
    } else {
        await Course.findByIdAndUpdate(courseId, {
            ratingQuantity: 0,
            ratingAverage: 4.5
        });
    }
}

reviewSchema.post("save", function () {
    this.constructor.calcAveragrRating(this.course)
})


module.exports = mongoose.model("Review", reviewSchema);
