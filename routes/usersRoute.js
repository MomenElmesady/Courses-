const express = require("express")
const userController = require("../constrollers/userController")
const authController = require("../constrollers/authController")
const router = express.Router()
const rateLimit = require("express-rate-limit")
const multer = require("multer")

const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split("/")[1]
        const fileName = `user-${Date.now()}.${ext}`
        cb(null, fileName)
    }
})

const upload = multer({ storage: diskStorage })


router.route("/:userId").get(userController.getUser)
router.route("/").get(authController.protect, userController.getAllUsers)
router.route("/register").post(upload.single("avatar"), authController.register)
router.route("/verify/:token").post(upload.single("avatar"), authController.verify)
router.route("/login").post(rateLimit.rateLimit({ max: 100, windowMs: 60*60*1000, message: "many requests!, try again later" }), authController.login)
router.route("/logout").post(authController.logout)
router.route("/refreshToken").patch(authController.refreshToken)

router.route("/teacher/:teacherId/courses").get(userController.getTeacherCourses)
router.route("/user/:userId/courses").get(userController.getUserCourses)

router.route("/showCart").post(authController.protect, userController.showCart)
router.route("/buy").post(authController.protect, userController.buy)

router.post("/sendVerfication", authController.sendVerivicationEmail)
router.post("/forgotPassword", authController.forgotPassword)
router.patch("/resetPassword/:token", authController.resetPassword)
router.patch("/updatePassword", authController.protect, authController.updatePassword)
module.exports = router