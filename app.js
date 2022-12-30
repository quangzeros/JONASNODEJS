const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController')
const app = express();

app.set('view engine', 'pug');

app.set('views', path.join(__dirname,'views'))

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
    next(new AppError(`Can't find ${req.originalUrl} on this server!`,404)); //Khi truyền vào err mà nó xảy ra lỗi thì sẽ bỏ qua
    //tất cả các Middleware mà chạy thẳng vào Error Handing Middleware
})


app.use(globalErrorHandler);

module.exports = app;



