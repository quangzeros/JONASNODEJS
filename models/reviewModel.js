const mongoose = require('mongoose');
const Tour = require('./../models/tourModel')

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    review:{
        type:String,
        require:[true,'Review can not be empty!']
    },
    rating:{
        type:Number,
        min:1,
        max:5
    },
    createAt:{
        type:Date,
        default:Date.now()
    },
    tour:{
        type:mongoose.Schema.ObjectId,
        ref: 'tourModel',
        required:[true,'Review must belong to a tour.']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref: 'user',
        require:[true,'Review must belong to a user']
    }
},
{
    toJSON: {virtuals:true},
    toObject:{virtuals:true}
})

reviewSchema.pre(/^find/, function(next){
    // this.populate({
    //     path:'tour',
    //     select:'name'
    // }).populate({
    //     path:'user',
    //     select:'name photo'
    // })

    this.populate({
            path:'user',
            select:'name photo'
        })

    next();
})

reviewSchema.statics.calcAverageRatings = async function(tourId){

    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id:'$tour',
                nRating:{$sum: 1},
                avgRating: {$avg:'$rating'}
            }
        }
    ])
    if(stats.length > 0){
        await  Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    }else{
        await  Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }

}

reviewSchema.index({tour:1,user:1} , {unique:true})

reviewSchema.post('save',function(doc){
    // this points to current review(this.constructor)

    this.constructor.calcAverageRatings(this.tour)

})



reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.model.findById(this._conditions._id)
    next();
})

reviewSchema.post(/^findOneAnd/, async function(doc){

    await this.r.constructor.calcAverageRatings(this.r.tour)
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;    