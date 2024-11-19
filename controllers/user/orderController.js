const User=require('../../models/userSchema')
const Order =require('../../models/orderSchema')
const Product =require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const Coupon = require('../../models/couponSchema')


const getOrders= async (req,res)=>{
    try {
        const userId=req.session.user;
        const user = await User.findById(userId);
        if(!userId){
            console.log('user not found');
            return res.redirect('/login')
        }
        const orders=await Order.find({user:userId}).sort({createdOn:-1})
        if(orders.length>0){
            res.render('orderList',{orders,user})
        }else{
            res.render('orderList',{orders:[],message:'no orders founded'})
        }
    } catch (error) {
        console.error("Error loading orders page", error);
        res.status(500).redirect('/page-not-found');

        
    }
}

const getOrderDetails= async (req,res)=>{
    try {
        const orderId=req.query.id;
        
        const userId=req.session.user;
        if(!userId){
            console.log('user not found');
            return res.redirect('/login')
        }
        const user=await User.findById(userId);
        const order= await Order.findById(orderId)
        const address=await Address.findOne({'address._id':order.address},{'address.$':1})
        const products=await Promise.all(
            order.orderedItems.map(async (item)=>{
                return await Product.findOne({_id:item.product})
            })
        );
        res.render('viewOrderDetails',{order,products,address:address.address[0],user})


    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound')
        
    }
}
const getOrderCancel= async (req,res)=>{
    try {
        const userId=req.session.user;
        if(!userId){
            console.log('user not found');
            return res.redirect('/login')
        }
        const id=req.query.id;
        const reason=req.query.reason;
        await Order.findByIdAndUpdate(id,{$set:{status:'Cancelled',cancelleationReson:reason}})
        res.redirect('/orders')
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound')

        
    }
}
const applyCoupon=async (req,res)=>{
    const {couponCode,totalPrice}=req.body;
    try {
        console.log('workk1');
        if (!couponCode || !totalPrice) {
            return res.status(400).json({ success: false, message: "Missing coupon code or price" });
        }
        console.log('workk2');
        const coupon =await Coupon.findOne({name:couponCode,expireOn:{$gt:Date.now()}})
        console.log('workk3');
        if(!coupon){
            return res.json({success:false,meassge:'invalid or expired coupon'})
        }
        const discount = parseFloat(coupon.offerPrice);
        console.log(discount);
        if (isNaN(discount)) {
            return res.status(400).json({ success: false, message: "Invalid discount value" });
        }
        console.log('workk4');
        const discountAmount = (totalPrice * discount) / 100;
        console.log(discountAmount);
        console.log('workk5');
        const finalTotal = totalPrice - discountAmount;
        console.log(finalTotal);
        console.log('workk6');
        res.status(200).json({
            success: true,
            discountAmount: discountAmount.toFixed(2),
            finalTotal: finalTotal.toFixed(2),
            message: "Coupon applied successfully!"
        });
    } catch (error) {
        console.error(error);
        
    }
}





module.exports={
    getOrders,
    getOrderDetails,
    getOrderCancel,
    applyCoupon
}


