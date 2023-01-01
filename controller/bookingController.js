const AppError = require('./../utils/appError');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./handlerFactory');
const Booking = require('./../models/bookingModel');
const crypto = require('crypto');
const exp = require('constants');
const User = require('./../models/userModel');

const stripe = require('stripe')('sk_test_51MGMMeGs4M8Y3iziZrFAjAn4Ab4rlCPohXFqZoKwCvu3kUei4uKpfuY5IEPcMPPODM9uEv1Qc6ZTtnkrWKfNI7Kp00FGzYlvfe')


exports.getCheckoutSession =catchAsync(async(req,res,next) =>{
    const {tourId } = req.params
    //1) Get current booked tour
    const tour = await Tour.findById(tourId);
    //2) Create checkout session    
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url:`${req.protocol}://${req.get('host')}/tour/${tour.slug}/my-tours`,
        cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: tourId,
        line_items:[{
            price_data: {
                product_data:{
                    name: `${tour.name} Tour`,
                    description: tour.summary,
                    images:[`https://www.natours.dev/img/tours/${tour.imageCover}`],
                },
                unit_amount : tour.price * 100,
                currency: 'usd',
            },
            quantity: 1
        }],
        mode: 'payment',
    })
    //3) Create session as response
    res.status(200).json({
        status: 'success',
        session:session
    })
})

// exports.createBookingCheckout = catchAsync( async (req,res,next) =>{
//     // This is only TEMPORARY, because it`s UNSECURE: everyone can make bookings withour paying
//     const {tour, user, price  } = req.query;
//     if (!tour && !user && !price ){
//         return next()
//     }
//     await Booking.create({tour,user,price})

//     res.redirect(req.originalUrl.split('?')[0])
// })

exports.isUserBookingTour = catchAsync(async(req,res,next)=>{
    if (req.user.role == 'admin'){
        return next();
    }
    //1) Find All Booking of this user
    const booking = await Booking.find({user: req.user.id})
    //2) All tours 
    const tourIds = booking.map(el => el.tour.id)
    
    if(!tourIds.includes(req.params.tourId)){
        return next(new AppError('You must have book this tour to review',401))
    }
    next();
})
const createBookingCheckout = async session  => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({email:session.customer_email})).id;
    const price = session.line_items[0].price_data.unit_amount / 100 ;
    await Booking.create({tour,user,price});
}

exports.webhookCheckout = async (req,res,next)=>{
    const signature = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhook.constructEvent(
            req.body, 
            signature,
            process.env.STRIPE_WEBHOOK_SECRET);

    }catch (err){
        return res.status(400).send(`Webhook error : ${err.message}`)
    }

    if(event.type ==='checkout.session.completed') {
        createBookingCheckout(event.data.object)
    }
    res.status(200).json({received:'true'})

}

exports.getAllBookings = handlerFactory.getAll(Booking)
exports.createBooking= handlerFactory.createOne(Booking)
exports.getBooking= handlerFactory.getOne(Booking)
exports.deleteBooking= handlerFactory.deleteOne(Booking)
exports.updateBooking= handlerFactory.updateOne(Booking)