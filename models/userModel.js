const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


// name,email,photo,password,passwordConfirm

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{
        type:String,
        require:[true,'Please tell us your name']
    },
    email:{
        type:String,
        require: [true,'Please provide your email'],
        unique:true,
        lowercase: true,
        validate: [validator.isEmail , 'Please provide a valid email']
    },
    photo:{
        type: String,
        default: 'default.jpg'
    },
    role:{
        type: String,
        enum: {
            values:['admin','user','guide','lead-guide'],
            message: 'User must have role'
        },
        default: 'user'
    },
    password:{
        type:String,
        require:[true,'Please provide a password'],
        minlength:8,
        select:false
    },
    // Require in INPUT but not DB ?
    passwordConfirm :{
        type:String,
        require: [true,'Please confirm your password'],
        validate: {
            //This only works on CREATE and SAVE!!!
            validator: function(el){
                return el === this.password;
            },
            message: 'Password are not the same'
        }
    },
    passwordChangedAt :{
        type: Date,
    },
    passwordResetToken:{
        type:String
    },
    passwordResetExpires: {
        type:Date
    },
    active:{
        type: Boolean,
        default:true,
        select:false
    }
})

userSchema.pre('save',async function(next){
    //Only run this Funtion if password was actually modified
    if(!this.isModified('password')) {
        return next();
    }
    //Hash the password with the cost 12
    this.password = await bcrypt.hash(this.password,12);  

    //Delete PasswordConfirm field
    this.passwordConfirm = undefined;
    next();
})

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew){
        return next();
    }
    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.pre(/^find/, function(next){
    this.find({active: {$ne : false}});

    next();
})

userSchema.methods.correctPassword = async function(
    candidatePassword, 
    userPassword
)   {
    return await bcrypt.compare(candidatePassword,userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() /1000,
            10);
        return JWTTimestamp < changedTimestamp
    }

    // False means not change
    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken =crypto
                                .createHash('sha256')
                                .update(resetToken)
                                .digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('user', userSchema);

module.exports = User;


