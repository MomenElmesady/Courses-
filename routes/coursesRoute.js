const express = require("express")
const coursesController = require("../constrollers/coursesController")
const authController = require("../constrollers/authController")
const allowedTo = require("../middlewares/allowedTo")

const router = express.Router()

router.route("/").get(coursesController.getAllCourses).post(coursesController.createCourse)
router.route("/aggregateTest").get(coursesController.test)
router.route("/search").get(coursesController.searchByName)
router.route("/analysesCategories").get(coursesController.analysesCategories)
router.route("/:courseId").get(coursesController.getCourse)
.patch(coursesController.updateCourse)
.delete(authController.protect,allowedTo("admin"),coursesController.deleteCourse)
router.route("/category/:category").get(coursesController.getCoursesForCategory)
router.route("/category/:category/topTeachers").get(coursesController.getTopTeachersForCategory)

router.route("/:courseId/like").post(authController.protect,allowedTo("user"),coursesController.like)
router.route("/:courseId/disLike").post(authController.protect,allowedTo("user"),coursesController.disLike)
router.route("/:courseId/addToCart").post(authController.protect,allowedTo("user"),coursesController.addToCart)
router.route("/:courseId/deleteFromCart").post(authController.protect,allowedTo("user"),coursesController.deleteFromCart)

module.exports = router