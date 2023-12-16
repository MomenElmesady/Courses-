// this line to till the system that there is a .enf file and config() method search for the file and add it 
const dotenv = require("dotenv")
dotenv.config({ path: "./config.env" })

const userRouter = require("./routes/usersRoute")
const coursesRouter = require("./routes/coursesRoute")
const reviewRouter = require("./routes/reviewRoute")
const express = require("express")
const mongoose = require("mongoose")
const appError = require("./utils/appError")
const xss = require("xss-clean")
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet")
const cookieParser = require("cookie-parser")
const hpp = require("hpp")
const app = express()

const DB = process.env.DB

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,
}).then(() => console.log('DB connection successful!'));


// to protect http headers we use helmet middleware
app.use(helmet())


app.use(express.json())
// if i pass email = {"$gt":""} and any password i will login by any password so to prevent this we use mongo sanitize 
// it prevent any $ or . from request 
// here trick -> we should use mongoSanitize() after express.json() becouse it handle it after operations with json objects 
app.use(mongoSanitize())
// to prevent any mallicous code like html or JS we use xss middleware 
app.use(xss())

// to prevent parameter pollution use hpp 
app.use(hpp())

app.use(cookieParser())
app.use("/uploads", express.static("./uploads"))


app.use("/api/courses", coursesRouter)
app.use("/api/users", userRouter)
app.use("/api/reviews", reviewRouter)

app.all("*", (req, res, next) => {
    return next(new appError("this route doesnt exist", 404, "error"))
})

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        status: err.statusText || "error",
        message: err.message
    })
})

const port = process.env.PORT || 3210
app.listen(port, () => {
    console.log("app.lestining on port 3210")
})