const express = require('express');
const reviewRouter = express.Router({mergeParams:true});
const reviewController = require('./../controller/reviewController');
const authController = require('./../controller/authController');
const bookingController = require('./../controller/bookingController');

reviewRouter.use(authController.protect);

reviewRouter.route('/')
            .get(reviewController.getAllReviews)
            .post(authController.restrictTo('user'),
                reviewController.setTourUserIds,
                bookingController.isUserBookingTour,
                reviewController.createReview)


reviewRouter.route('/:id')
            .get(reviewController.getReview)
            .patch(authController.restrictTo('user','admin'),
            bookingController.isUserBookingTour,
            reviewController.updateReview)
            .delete(authController.restrictTo('user','admin'),
            bookingController.isUserBookingTour,
            reviewController.deleteReview)




module.exports = reviewRouter