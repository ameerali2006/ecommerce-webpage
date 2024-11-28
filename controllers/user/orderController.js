const User=require('../../models/userSchema')
const Order =require('../../models/orderSchema')
const Product =require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const Coupon = require('../../models/couponSchema')
const Wallet=require('../../models/walletSchema')


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
        const order = await Order.findById(id);
        if (!order) {
            console.log('Order not found');
            return res.redirect('/orders');
        }
        if (order.paymentMethod === 'Online' && order.paymentStatus === 'Completed') {
            const refundAmount = order.finalAmount;
            console.log(refundAmount);

            // Update the user's wallet
            const wallet = await Wallet.findOneAndUpdate(
                { userId },
                {
                    $inc: { balance: refundAmount }, // Increment wallet balance
                    $push: {
                        transactions: {
                            type: 'Refund',
                            amount: refundAmount,
                            orderId: id,
                            description: `Refund for cancelled order #${id}`,
                            status: 'Completed', // Assuming the refund is instant
                        },
                    },
                    lastUpdated: new Date(),
                },
                { new: true, upsert: true } // Create wallet if not present
            );

            console.log(`Refund of ₹${refundAmount} added to wallet for user ${userId}`);
        }


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
        const userId=req.session.user
        if (!couponCode || !totalPrice) {
            return res.status(400).json({ success: false, message: "Missing coupon code or price" });
        }
        
        const coupon =await Coupon.findOne({name:couponCode,expireOn:{$gt:Date.now()}})
        if(!coupon){
            return res.json({success:false,meassge:'invalid or expired coupon'})
        }
        if(coupon.userId.includes(userId)){
            return res.json({ success: false, message: "coupon is already used by you" });

        }
        const discount = parseFloat(coupon.offerPrice);
        if (isNaN(discount)) {
            return res.status(400).json({ success: false, message: "Invalid discount value" });
        }
        const discountAmount = (totalPrice * discount) / 100;
        const finalTotal = totalPrice - discountAmount;
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
const removeCoupon = async (req, res) => {
    try {
  
      const { totalPrice } = req.body;
  
      const discountAmount = 0;
      const finalTotal = totalPrice;
  
      res.json({
        success: true,
        discountAmount,
        finalTotal,
      });
  
    } catch (error) {
      console.error("Error removing coupon", error);
      res.status(500);
    }
  }





module.exports={
    getOrders,
    getOrderDetails,
    getOrderCancel,
    applyCoupon,
    removeCoupon
}


