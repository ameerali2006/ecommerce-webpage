const mongoose = require('mongoose');
const {Schema}=mongoose




const couponSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expireOn:{
        type:Date,
        required:true
    },
    offerPrice:{
        type:Number,
        requires:true

    },
    minimumPrice:{
        type:Number,
        required:true
    },
    maximumPrice:{
        type:Number,
        required:true
    },
    isList:{
        type:Boolean,
        default:true
    },
    userId:[{
        type:Schema.Types.ObjectId,
        ref:'User'
    }]

})

const Coupon=mongoose.model('Coupon',couponSchema)
module.exports=Coupon