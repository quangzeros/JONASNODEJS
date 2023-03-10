const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParse =require('body-parser');
const compression = require('compression');
const cors = require('cors');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controller/bookingController');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController')
const app = express();

app.set('view engine', 'pug');

app.set('views', path.join(__dirname,'views'))

//Access-Control-Allow-Origin *
app.use(cors());// Allow all Domain to access 
//(this only have 2 type of requests: GET and POST)
//api.natours.com  -> allow Front-END natours.com can access API
// we use app.use(cors(
//  origin :'https://www.natours.com'
//))

app.options('*',cors());// only all Routes to be use COMPLEX REQUEST
//app.options('api/v1/tour/:id',cors()) =>Ony allow 'api/v1/tour' can be used COMPLEX REQUEST  such as DELETE, PATCH,PUT....


//Serving static files
app.use(express.static(path.join(__dirname,'public')))

//set Security HTTP HEADERS
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
//Limit requests from same IP
const limiter  = rateLimit({
    max:100,
    windowMs: 60 *60 *1000,
    // Allow 100 request for  each IP on 1 hours,
    message:'Too many requests from this IP, please try again in an hour!'
})

app.use('/api',limiter);

// Hello world
// Middleware
if(process.env.NODE_ENV = 'development'){
    app.use(morgan('dev'));
}
app.post('/webhook-checkout',bodyParse.raw({type:'application/json'}) ,bookingController.webhookCheckout)
//Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended:true,limit:'10kb'}))
app.use(cookieParser())

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//DATA sanitize againt XSS
app.use(xss());

//Prevent parameter solution
app.use(hpp({
    whitelist: ['duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'price',
    'difficulty'
]
}));

app.use(compression());

app.use((req,res,next)=>{
    // console.log(req.cookies)
    next();
})

//ROUTES
app.use('/',viewRouter)
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter); 
app.use('/api/v1/bookings',bookingRouter); 

app.all('*',(req,res,next)=>{

    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;
    next(new AppError(`Can't find ${req.originalUrl} on this server!`,404)); //Khi truy???n v??o err m?? n?? x???y ra l???i th?? s??? b??? qua
    //t???t c??? c??c Middleware m?? ch???y th???ng v??o Error Handing Middleware
})


app.use(globalErrorHandler);

module.exports = app;



