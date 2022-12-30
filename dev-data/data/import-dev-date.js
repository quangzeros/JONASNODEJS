const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

const path = require('path');
dotenv.config({path:'./config.env'});

const DB = process.env.DATABASE.replace(
    '<password>', 
    process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(con =>{
    console.log('DB Connections')
});


//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(path.join(__dirname,'tours.json'), 'utf-8'))
const users = JSON.parse(fs.readFileSync(path.join(__dirname,'users.json'), 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(path.join(__dirname,'reviews.json'), 'utf-8'))

// IMPORT DATA INTO DB
const importData = async () =>{
    try{
        await Tour.create(tours)
        await User.create(users, {validateBeforeSave: false})
        await Review.create(reviews)
        console.log('Data successfully load!');
    }catch(err){
        console.log('we have error when import');
    }
    process.exit();
}

// DELETE ALL DATA FROM DB
const deleteData = async () =>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfully deleted!');
    }catch(err){
        console.log('we have error when delete');
    }
    process.exit();
}

if (process.argv[2] == '--import'){
    importData();
}else if (process.argv[2]='--delete'){
    deleteData();
}