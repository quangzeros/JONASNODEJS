const mongoose = require('mongoose');
const dotenv = require('dotenv')
process.on('uncaughtException',(err)=>{
    console.log('UNCAUGHT EXCEPTION! Shutting down....')
    console.log(err.name , err.message)
    process.exit(1);
})// Catch Sync Code Error, when have a sync code error in middleware
// function request it will go to Error Handler funtion
const app = require('./app');

app.enable('trust proxy')


dotenv.config({path:'./config.env'})

const DB = process.env.DATABASE.replace(
    '<password>', 
    process.env.DATABASE_PASSWORD)

mongoose.connect(DB)
        .then(con =>{
            console.log('DB Connections')
        })

process.env.NODE_ENV = 'development'
console.log(process.env.NODE_ENV)


const port = process.env.PORT || 8000;
const server = app.listen(port , ()=>{
    console.log(`App Runing on port ${port}`)
})

//Xử lí lỗi khi Async Code =>Reject 
process.on('unhandledRejection' , (err) =>{
    console.log('UNHANDLER REJECTION! Shutting down....')
    console.log(err.name , err.message)
    server.close(() =>{
        process.exit(1)
    })// sever.close wait for all peding , request.... finished
    // after all finish => execute callback funtion
})



