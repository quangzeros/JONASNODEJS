const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeature = require('./../utils/apiFeatures');


exports.deleteOne = (Model) =>{
    return catchAsync(async (req,res,next)=>{

        const doc = await Model.findByIdAndDelete(req.params.id)
    
        if(!doc){
            return next(new AppError('No document found with that ID',404))
        }
    
        res.status(204).json({
                status:'success',
                data:null
        })
    });
}

// DO not update password with this
exports.updateOne =(Model) =>{
    return catchAsync(async (req,res,next)=>{
        const doc = await Model.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true,
        })
    
        if(!doc){
            return next(new AppError('No document found with that ID',404))
        }
    
        res.status(200).json({
            status: 'success',
            data : {
                data: doc
            }
        })  
    })
}

exports.createOne = (Model) =>{
    return catchAsync(async (req,res,next)=>{
        const newDoc = await Model.create(req.body);
    
            res.status(201).json({
                status:'success',
                data:{
                    data: newDoc
                }
            })
    })
}

exports.getOne =(Model, popOptions) =>{
    return catchAsync(async (req,res,next)=>{
        let query =  Model.findById(req.params.id)
        if(popOptions){
            query =  query.populate(popOptions)
        }
        const doc = await query
    
        if(!doc){
            return next(new AppError('No document found with that ID',404))
        }
            res.status(200).json({
                status: 'success',
                data:{
                    doc:doc
                }
            })    
    })
    
}

exports.getAll = (Model) =>{
    return catchAsync(async (req,res,next)=>{
        //to Allow for nested  GET reviews on tour



        let nested = {}
        if (req.params.tourId){
            nested = {tour: req.params.tourId}
        }


        const features = new APIFeature(Model.find(nested),req.query)
                                                .filter()
                                                .sort()
                                                .limitFields()
                                                .pagination();
            const docs = await features.query;                                  
            // const docs = await features.query.explain();                                  
                res.status(200).json({
                status: 'success',
                result: docs.length,
                data : {
                    data: docs
                }
            })
    })

}