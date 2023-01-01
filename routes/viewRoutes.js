const express = require('express');
const viewRouter = express.Router();

const viewController = require('./../controller/viewController');
const authController = require('./../controller/authController');
const bookingController = require('./../controller/bookingController')


viewRouter.use(viewController.alerts);

viewRouter.get('/',
// bookingController.createBookingCheckout,
authController.isLoggedIn,
viewController.getOverview )



viewRouter.get('/tour/:slug',authController.isLoggedIn,viewController.getTour)

// /login
viewRouter.get('/login',authController.isLoggedIn, viewController.getLoginForm)

//getAccountSetting
viewRouter.get('/me',authController.protect,viewController.getAccount)

//Updata user data (POST)
viewRouter.post('/submit-user-data',authController.protect, viewController.updateUserData)

//My-booking
viewRouter.get('/my-tours', 
authController.protect, 
viewController.getMyTours)
module.exports = viewRouter;

