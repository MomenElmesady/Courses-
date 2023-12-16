const mongoose = require("mongoose");

const courseSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    teacher: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "should have teacher"]
    },
    ratingAverage: {
        type: Number,
        min: [1, "rating must be more than 1 "],
        max: [5, "rating must be less than 5"],
        default: 4.5
    },
    ratingQuantity: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    disLikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    category:{
        type: String,
        required: [true, "The course must have category"]
    }
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

courseSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'course',
    localField: '_id'
});

// ? becouse if we select in query the likes array disappear and it return error 
courseSchema.virtual("Number of likes").get(function(){
    return this.likes?.length
})
courseSchema.virtual("Number of disLikes").get(function(){
    return this.disLikes?.length
})
// courseSchema.virtual("Number of buyers").get(function(){
//     return this.buyers.length
// })



module.exports = mongoose.model("Course", courseSchema);

