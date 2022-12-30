const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

const Schema = mongoose.Schema;

const tourSchema = new Schema({
    name: {
        type:String,
        required:[true, 'A tour must have a name'],
        unique:true,
        trim: true,
        maxlength: [40,'A tour name must have less or equal then 40 characters'],
        minlength: [10,'A tour name must have more or equal then 10 characters']
    },
    slug:{
        type:String
    },
    duration:{
        type:Number,
        required:[true,'A tour must have a duration']
    },
    maxGroupSize:{
        type:Number,
        required:[true,'A tour must have a group size']
    },
    difficulty:{
        type:String,
        required:[true,'A tour must have a price'],
        enum: {
            values:['easy', 'medium','difficult'],
            message: 'Difficulty is either : easy, medium, difficult'
        },
    },
    ratingsAverage:{
        type:Number,
        default:4.5,
        min:[1,'Rating must be above 1.0'],
        max:[5,'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10 // Round => INTERGER
    },
    ratingsQuantity:{
        type:Number,
        default:0,
    },
    price:{
        type:Number,
        required:[true, 'A tour must have a price']
    },
    priceDiscount:{
        type:Number,
        validate: {
            validator: function(val){
                if (this?._update){
                    return val < this._update['$set'].price
                }            
                return val < this.price;// this trỏ vào current document
                // và sẽ ko hoạt động vs value của update
            },
            message: 'Discountprice ({VALUE}) should be below regular price'
        },
        
    },
    summary:{
        type:String,
        trim: true,
    },
    description:{
        type:String,
        trim:true,
        required:[true, 'A tour must have a description']
    },
    imageCover:{
        type:String,
        required:[true, 'A tour must have a cover Image']
    },
    images:[String],
    createdAt:{
        type:Date,
        default: Date.now(),
    },
    startDates:[Date],
    secretTour:{
        type:Boolean,
        default:false
    },
    startLocation:{
        // GeoJSON 
        type:{
            type:String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates:[Number],
        address:String,
        description:String,
    },
    locations:[
        {
            type:{
                type:String,
                default:'Point',
                enum:['Point']
            },
            coordinates:[Number],
            description:String,
            day:Number,
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref:'user'
        }
    ]
    
},{
    toJSON: {virtuals:true},
    toObject:{virtuals:true}
});

// tourSchema.index({price: 1})
tourSchema.index({price:1,ratingsAverage:-1})
tourSchema.index({slug:1})
tourSchema.index({startLocation:'2dsphere'})


tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7 ;
})

//Virtual populate
tourSchema.virtual('reviews',{
    ref:'Review',// trỏ đến con
    localField:'_id',//Định dạng cái field của mình sẽ match vs cái trở đến
    foreignField:'tour'//Trỏ đến fleid tour của Ref để so sánh vs local field
})

//DOCUMENT MIDDLEWARE , runs before .save() and .create() .insertMany()// chạy trc khi dữ liệu save
tourSchema.pre('save',function(next){
    this.slug = slugify(this.name , {lower:true});
    next();
})

// tourSchema.pre('save',async function(next){
//     const guidesPromises = this.guides.map(async (id)=>await User.findById(id));
//     this.guides = await Promise.all(guidesPromises)
//     next();
// })

tourSchema.pre('save',function(next){
    console.log('Will save document');
    next();
})


// POST MIDDLEWARE EXECUTE when All PreMiddleware is done
tourSchema.post('save',function(doc,next){
    
    next();
});

//QUERY MIDDLEWARE (execute before await query)
tourSchema.pre(/^find/,function(next){
    this.find({secretTour:{$ne:true}})
    if(this?._update){
        if(this._update?.name){
            this._update.slug = slugify(this._update.name)
        }
    }
    this.start = Date.now();
    next();
})

tourSchema.pre(/^find/, function(next){
    this.populate({
        path:'guides',
        select:'-__v -passwordChangeAt -passwordResetExpires -passwordResetToken'
    })

    next();
})
// After Query EXECUTED
tourSchema.post(/^find/,function(docs,next){
    console.log(`Query took ${Date.now() - this.start} miliseconds`)
    next();
})





//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate',function(next){
    if(Object.keys((this._pipeline[0]))[0] === '$geoNear'){
        next();
    }else{
        this._pipeline.unshift({'$match':{secretTour: {$ne:true}}})
        next()
    }
});






// PRE(chuẩn bị trước khi thực hiện 1 tác vụ gì đấy , ta có 
//thể thêm sửa xóa tại đây) || POST(sau khi đã hoàn thành tác vụ đó và trả về
//DOC(data) của dữ liệu , tại đây thay đổi hay sửa xóa sẽ ko ảnh hưởng đến DB)

// PRE(middleware) => Interact with DB => POST(middleware) => RENDER cho người dùng


const Tour = mongoose.model('tourModel' , tourSchema);

module.exports = Tour;