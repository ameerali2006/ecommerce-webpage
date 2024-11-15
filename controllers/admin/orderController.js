const User=require('../../models/userSchema')
const Order =require('../../models/orderSchema')
const Product =require('../../models/productSchema')
const Address = require('../../models/addressSchema')



const getAllorders=async (req,res)=>{
    try {
        const limit=5;
        const page=Math.max(1,parseInt(req.query.page)||1)
        const orders=await Order.find().populate('user').populate('orderedItems.product').limit(limit).skip((page-1)*limit);
        const count=await Order.countDocuments()
        res.render('orders',{orders,totalPages:Math.ceil(count/limit),currentPage:page})
    } catch (error) {
        console.error(error);
        res.redirect('admin/pageerror')
        
    }
}







module.exports={
    getAllorders,

}





