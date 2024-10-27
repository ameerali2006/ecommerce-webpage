const mongoose = require('mongoose');
const {Schema}=mongoose


const brandSchema= new Schema({
    brandName:{
        type:String,
        required:true
    },
    brandiImage:{
        type:[String],
        required:true
    },
    isBlock:{
        type:Boolean,
        default:false
    },
    createAt:{
        type:Date,
        default:Date.now
    }

})
const Brand=mongoose.model('Brand',brandSchema);
module.exports=Brand
