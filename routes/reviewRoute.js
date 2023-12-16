const express = require("express")
const reviewController = require("../constrollers/reviewController")
const authController = require("../constrollers/authController")
const allowedTo = require("../middlewares/allowedTo")

const Router = express.Router()

Router.route("/").get(reviewController.getAllReviews).post(authController.protect,reviewController.checkRestrict,reviewController.createReview)

// Router.route("/:courseId").get(coursesController.getCourse)
// .patch(coursesController.updateCourse)
// .delete(userController.protect,allowedTo("admin"),coursesController.deleteCourse)

module.exports = Router