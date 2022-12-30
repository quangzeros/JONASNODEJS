const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');
const crypto = require('crypto');



const signToken = (id)=>{
    return jwt.sign({id: id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const cookieOptions =  {
    //Time,Browser save token,when time elapse over,Browser will delete it
    expires: 
        Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 *1000)
    ,
    //PROTECT COOKIE FROM MODIFIED
    httpOnly:true,
}
if(process.env.NODE_ENV ==='production'){cookieOptions.secure = true}

const createSendToken = (user,statusCode,res)=>{
    const token = signToken(user._id)

    res.cookie('jwt', token, cookieOptions)

    user.password = undefined
    res.status(statusCode).json({
        status:'success',
        token:token,
        data:{
            user: user ,
        }
    })
}

exports.signup =  catchAsync(async(req,res,next) =>{
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role:req.body.role

    });
    const url = `${req.protocol}://${req.get('host')}/me`
    await new Email(newUser,url).sendWelcome();

    createSendToken(newUser,201,res)
});

exports.login = catchAsync(async(req,res,next)=>{
    const {email,password} = req.body;

    //1) Check if email and password exist
        if(!email || !password){
            return next(new AppError('Please provide email and password',400))
        }
    //2) Check if user exits && password is correct
        const user = await User.findOne({email: email}).select('+password')
       
        if(!user || !(await user.correctPassword(password,user.password))){
            return next(new AppError('Incorrect email or password',401))
        }
       
    //3)If everything ok, send token to client
    createSendToken(user,200,res)
})

exports.logout = (req,res,next) =>{
    res.cookie('jwt','logged out', {
        expires: new Date(Date.now() + 10 *1000),
        httpOnly: true,
    })

    res.status(200).json({status: 'success'})
}
exports.protect = catchAsync(async(req,res,next)=>{
    //1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    }else if(req.cookies.jwt){
        token = req.cookies.jwt
    }
    if(!token){
        return next( new AppError('You are not logged in! Please log in to get access.',401))
    }
    //2)Verification token
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)
    //3) Check if user still exists(Maybe user has been Deleted when expired JWT still exists)
    const currentUser = await User.findById(decoded.id)
    if(!currentUser){
        return next(new AppError('The user belonging to this token does no longer exist.',401))
    }
    //4) Check if user change password after the JWT was issued
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User rencetly changed password! Please log in again.',401 ))
    }

    //GRANT ACCESS TO PROTECT ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
})

// Only for render pages, no errors!
exports.isLoggedIn = async(req,res,next)=>{
    //1) Getting token and check if it's there
    if(req.cookies.jwt){
    try{
        //2)Verification token
        const decoded = await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET)
        //3) Check if user still exists(Maybe user has been Deleted when expired JWT still exists)
        const currentUser = await User.findById(decoded.id)
        if(!currentUser){
            return next()
        }
        //4) Check if user change password after the JWT was issued
        if(currentUser.changedPasswordAfter(decoded.iat)){
            return next()
        }
    
        //There is a logged in user
        res.locals.user = currentUser
        return next();
    }catch(err){
        return next()
    }
    }
    next();
}

exports.restrictTo = (...roles)=>{
    return (req,res,next) =>{
        if (!roles.includes(req.user.role)){
            return next(new AppError("You don't have permission to perform this action",403))
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async(req,res,next) =>{
    //1) Get user based on Posted Email
    const user = await User.findOne({email:req.body.email})
    if(!user){
        return next(new AppError('There is no user with email address',404))
    }
    //2) Generate the random reset token
    const resetToken = user.createPasswordResetToken(); 
    await user.save({validateBeforeSave:false});

    //3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        'host')}/api/v1/user/resetPassword/${resetToken}`;        
        try{   
            await new Email(user , resetURL).sendPasswordReset();
    
            res.status(200).json({
                status:'success',
                message:'Token sent to email!'
            })
        }catch(err){
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined
            await user.save({validateBeforeSave:false});


            return next(new AppError('There was an error sending the email. Try again later!',500))
    }
})
exports.resetPassword = catchAsync(async(req,res,next) =>{

    //1) get user based on the token
    const hasedToken  = crypto
                            .createHash('sha256')
                            .update(req.params.token)
                            .digest('hex')
    const user = await User.findOne({
        passwordResetToken: hasedToken , 
        passwordResetExpires:{$gt: Date.now()}});

    
    //2) If token has not expired,adn there is user, set new password
    if(!user){
        return next(new AppError('Token is invalid or has expired',400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    //3) update changePasswordAt property for the user

    //4) Log the user in , send JWT
    createSendToken(user,200,res)
})

exports.updatePassword = catchAsync(async(req,res,next) =>{
    //1) Get user from collection
    const user = await User.findById(req.user.id).select('+password')
    //2) Check if POSTed current password is correct
    if(!await user.correctPassword(req.body.currentPassword,user.password)){
        return next(new AppError('Your current Password is incorrect',401))
    }
    //3) IF so , update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    await user.save();

    //4 Log user in, send JWT
    createSendToken(user,200,res)

})