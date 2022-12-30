const express = require('express');
const tourRouter = express.Router();
const tourController = require('../controller/tourController');
const authController = require('./../controller/authController');
const reviewController = require('./../controller/reviewController');
const reviewRouter = require('./reviewRoutes');
// Review ROUTER

tourRouter.use('/:tourId/reviews', reviewRouter)

// tourRouter.param('id',tourController.checkID)

tourRouter.route('/top-5-cheap').get(tourController.aliasTopTours,tourController.getAllTours)

tourRouter.route('/tour-stats').get(tourController.getTourStats);

tourRouter.route('/monthly-plan/:year').get(authController.protect,
    authController.restrictTo('admin', 'lead-guide','guide'),
    tourController.getMonthlyPlan);

tourRouter.route('/tours-within/:distance/center/:latlng/unit/:unit')
            .get(tourController.getToursWithin)

tourRouter.route('/distances/:latlng/unit/:unit')
            .get(tourController.getDistances)

tourRouter.route('/')
.get(tourController.getAllTours)
.post(authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour);

tourRouter.route('/:id')
.get(tourController.getTour)
.patch(authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour)
.delete(
    authController.protect,
    authController.restrictTo('admin' ,'lead-guide'),
    tourController.deleteTour)
    
                



module.exports = tourRouter