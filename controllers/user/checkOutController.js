const User=require('../../models/userSchema')
const Cart=require('../../models/cartSchema')
const Product =require('../../models/productSchema')
const Category =require('../../models/categorySchema')
const Address =require('../../models/addressSchema')
const Order =require('../../models/orderSchema')
const Razorpay = require('razorpay');
const Coupon = require('../../models/couponSchema')
const env = require('dotenv').config()

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});




const getCheckOut= async (req,res)=>{
    try {
        const userId=req.session.user;
        if(!userId){
            console.log('user not found');
            return res.redirect('/login')
        }
        const cart=await Cart.findOne({userId}).populate('items.productId')
        if(!cart || cart.items.length===0){
            console.log('cart not found');
            return res.redirect('/');

        }
        const user=await User.findById(userId);
        if(!user){
            console.log('user not found');
            return res.redirect('/login')
        }

        const address= await Address.findOne({userId})

        const cartTotal=cart.items.reduce((total,item)=>total+item.totalPrice,0)


        res.render('checkout',{addresses:address.address,cart:cart.items,fullCart:cart,cartTotal})
    } catch (error) {
        console.error(error);
        res.render('page-404')

        
    }
}

const CheckOut = async (req, res) => {
    try {
        const { payment_method,cartproducts, addressId,totalPrice, finalPrice,CouponCode } = req.body;
        console.log(req.body);

        // Check if user is logged in
        const userId = req.session.user;
        if (!userId) {
            console.log('User not found');
            return res.redirect('/login');
        }
        
        // Retrieve the user's cart
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            console.log('Cart not found or empty');
            return res.redirect('/');
        }
        let code=''
        if(CouponCode){
            code=CouponCode
        }
        const couponApplied=Boolean(CouponCode&& CouponCode.trim()!=='')

        // Prepare ordered items
        const orderedItems = cart.items.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.totalPrice / item.quantity
        }));
        console.log('workk')
        // Check if required fields are present
        if (!finalPrice || !addressId || !payment_method) {
            console.log('Missing required fields');
            return res.status(400).send('Incomplete checkout information');
        }
        let paymentStatus;
        if(payment_method=='Online'){
            paymentStatus='Completed'
        }

        // Create the order
        const createOrder = new Order({
            orderedItems,
            user:userId,
            totalPrice: totalPrice,
            finalAmount: finalPrice,
            address: addressId,
            paymentMethod: payment_method,
            status:'pending',
            couponApplied,
            couponCode:code,
            discount:totalPrice-finalPrice+40,
            deliveryCharge:40,
            paymentStatus



        });
        if(CouponCode){
            await Coupon.findOneAndUpdate({name:CouponCode},{$push:{userId:userId}});
        }

        
        console.log('Order created:', createOrder);

        // Save the order and handle errors if any
        await createOrder.save();
        for (const item of orderedItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.quantity = product.quantity - item.quantity;
                if (product.quantity < 0) {
                    console.error(`Stock insufficient for product ID: ${product._id}`);
                    return res.status(400).send(`Insufficient stock for product: ${product.name}`);
                }
                await product.save();
            }
        }
        
        cart.items=[];
        await cart.save()
        console.log('Order saved successfully');

        // Redirect on successful order creation
        res.render('successCheckOut',{orderId:createOrder._id })
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).send('Internal Server Error');
    }
};
const createPayment = async (req, res) => {
    const { amount } = req.body; 
    const amt = Number(amount)
    const options = {
        amount: amt * 100,   
        currency: 'INR',
        receipt: 'receipt#1',   
    };
    console.log(options)

    try {
        const order = await razorpay.orders.create(options);
        res.json({ success: true, orderId: order.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
}



module.exports={
    getCheckOut,
    CheckOut,
    createPayment
}