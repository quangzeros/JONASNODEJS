
const Tour = require('../models/tourModel');
const AppError = require('./../utils/appError');

const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./handlerFactory')
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();
const multerFilter = (req,file,cb) =>{
    if (file.mimetype.startsWith('image')){
        cb(null,true)
    }else{
        cb(new AppError('Not an image!Please upload only images',400),false)
    }
}   
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    {name:'imageCover', maxCount : 1},
    {name:'images', maxCount:3}
])
//upload.single('imageCover') => req.file
//upload.array('images',3) => req.files

exports.resizeTourImages = async(req,res,next) =>{
    if(!req.files.imageCover || !req.files.images){
        return next();
    }
    //1 Image Cover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333)
    .toFormat('jpeg')
    .jpeg({ quality:90 })
    .toFile(`public/img/tours/${req.body.imageCover}`); 

    //2  Images
    req.body.images = [];

    await Promise.all(req.files.images.map(async (file,index) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${index +1}.jpeg`
        await sharp(file.buffer)
        .resize(2000,1333)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${filename}`);
        req.body.images.push(filename);
    }));

    console.log(req.body)

    next()
}


exports.aliasTopTours = (req,res,next) =>{
    req.query.limit = '5';
    req.query.sort  = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'; 
    next();
}



exports.getAllTours = handlerFactory.getAll(Tour)
exports.getTour = handlerFactory.getOne(Tour,{path:'reviews'})
exports.createTour = handlerFactory.createOne(Tour)
exports.updateTour = handlerFactory.updateOne(Tour)
exports.deleteTour = handlerFactory.deleteOne(Tour)

exports.getTourStats =catchAsync (async (req,res,next)=>{
    const stats = await Tour.aggregate([
        {
            $match : { ratingsAverage :{$gte: 4.5} }
        },
        {
            $group:{
                _id:{ $toUpper:'$difficulty'},
                numTours:{$sum:1},
                numRatings:{$sum: '$ratingsQuantity'},
                avgRating: {$avg :'$ratingsAverage'},
                avgPrice: {$avg : '$price'},
                minPrice:{$min :'$price'},
                maxPrice:{$max :'$price'},
            }
        },
        {
            $sort: {
                minPrice: 1
            }
        }
    ])
    res.status(200).json({
        status: 'success',
        data : {
            stats: stats,next
        }
    })
})

exports.getMonthlyPlan =catchAsync (async (req,res,next)=>{
    const year = req.params.year *1 ;//2021

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates' // nh???n v??o ph???n t??? l?? 1 array r???i tr??? v??? document g???m m???i ph???n t??? ch???a thu???c t??nh ???? l?? ph???n t??? c???a array ????
        },
        {
            $match: {
                startDates:{
                    $gte: new Date (`${year}-01-01`),
                    $lte : new Date (`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id:{$month: '$startDates'},
                numTourStarts : {$sum: 1},
                tours :  {$push : '$name'}
            }
        },
        {
            $addFields : {month: '$_id'}
        },
        {
            $project: {
                _id:0,

            }
        },
        {
            $sort: {numTourStarts:-1 }
        },
        {
            $limit : 12
        }
    ]);

    res.status(200).json({
        status: 'success',
        count: plan.length,
        data : {
            plan:plan
        }
    })
})

exports.getToursWithin = catchAsync(async(req,res,next) =>{
    // unit : ????n v???
    const {distance , latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
        return next(
            new AppError(
                'Please provide latitude and longtitude in the format lat,lng'
                ,400))
    }
    const radius = unit  === 'mi' ?distance / 3963.2 : distance / 6378.1;
    const tours = await Tour.find({
        startLocation: {$geoWithin :{$centerSphere: [[lng,lat],radius]}}});

    console.log(radius)
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data:{
            data:tours
        }
    })
})

exports.getDistances = catchAsync(async(req,res,next) =>{
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
        return next(
            new AppError(
                'Please provide latitude and longtitude in the format lat,lng'
                ,400))
    }

    const multiplier = unit === 'mi' ? 0.000621371192 : 0.001

    const distance = await Tour.aggregate([
        {
            $geoNear : {
                near: {
                    type: 'Point',
                    coordinates: [lng *1 , lat *1]
                },
                distanceField: "distance",
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance:1,
                name:1,

            }
        }
    ])

    res.status(200).json({
        status: 'success',
        data:{
            data:distance
        }
    })

})