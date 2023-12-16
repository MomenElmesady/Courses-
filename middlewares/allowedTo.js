const appError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

module.exports = (...roles) => {
    return (req, res, next) => {
        if (roles.includes(req.user.role))
            next()
        else
            return (next(new appError("Dont have access to this route", 403)))
    }
}