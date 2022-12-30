const express = require('express');
const multer = require('multer');
const userRouter = express.Router();
const userController = require('../controller/userController');
const authController = require('./../controller/authController');


// LOGIN AND SIGNUP
userRouter.post('/signup', authController.signup)
userRouter.post('/login', authController.login)
//Log out
userRouter.get('/logout', authController.logout)

// FORGOT PASSWORD
userRouter.post('/forgotPassword', authController.forgotPassword)
userRouter.patch('/resetPassword/:token', authController.resetPassword)

//PROTECT ALL  ROUTE AFTER THIS MIDDLEWARE
userRouter.use(authController.protect);

// CHANGE PASSWORD
userRouter.patch('/updateMyPassword',
authController.updatePassword)

//Update user data
userRouter.patch('/updateMe',
userController.uploadUserPhoto,
userController.resizeUserPhoto,
userController.updateMe)

//Soft Delete
userRouter.delete('/deleteMe',
userController.deleteMe)

//GET CURRENT USER LOGIN DATA
userRouter.get('/me',
userController.getMe,userController.getUser)

//PROTECT FROM NORMAL USER CAN USE
userRouter.use(authController.restrictTo('admin'));

userRouter
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

userRouter
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)





module.exports = userRouter