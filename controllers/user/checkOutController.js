const User=require('../../models/userSchema')
const Cart=require('../../models/cartSchema')
const Product =require('../../models/productSchema')
const Category =require('../../models/categorySchema')
const Address =require('../../models/addressSchema')
const Order =require('../../models/orderSchema')
const Razorpay = require('razorpay');
const Coupon = require('../../models/couponSchema')
const env = require('dotenv').config()
const crypto = require('crypto'); 

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});




const getCheckOut= async (req,res)=>{
    try {
        const userId=req.session.user;
        const productId= req.query.id;
        
        
        if(!userId){
            console.log('user not found');
            return res.redirect('/login')
        }

        const address= await Address.findOne({userId})
        let cartItems=[];
        let cartTotal=0;


        if(productId){
            const product =await Product.findById(productId);
            if(!product){
                console.log('Product not founded');
                return res.redirect('/');

            }
            cartItems = [
                {
                    productId: product,
                    quantity: 1,
                    totalPrice: product.price,
                },
            ];
            cartTotal = product.salePrice;
        }else{
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            if(!cart||cart.items.length===0){
                console.log('Cart not found or empty');
                res.redirect('/');
            }
            cartItems = cart.items;
            cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
            
        }


        
        

        console.log(cartTotal);


        res.render('checkout',{addresses:address.address,cart:cartItems,cartTotal,key_id:process.env.RAZORPAY_KEY_ID})
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
        // if (!cart || cart.items.length === 0) {
        //     console.log('Cart not found or empty');
        //     return res.redirect('/');
        // }
        let code=''
        if(CouponCode){
            code=CouponCode
        }
        const couponApplied=Boolean(CouponCode&& CouponCode.trim()!=='')

        // Prepare ordered items
        const orderedItems = [];
        for (const item of cart.items) {
            const product = await Product.findById(item.productId);

            if (!product || product.isBlock) {
                console.error(`Product is blocked or not found: ${item.productId}`);
                return res.status(400).send(`Product not available for purchase: ${item.productId}`);
            }

            orderedItems.push({
                product: item.productId,
                quantity: item.quantity,   
                price: item.totalPrice / item.quantity,
            });
        }
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
    try {
        const { amount } = req.body;
        const paymentAmount = Number(amount) * 100; 

        
        const options = {
            amount: paymentAmount,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        
        const order = await razorpay.orders.create(options);

        console.log('Razorpay order created:', order);
        res.status(202).json({ success: true, orderId: order.id });
    } catch (error) {
        console.error('Failed to create Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate payment' });
    }
};

const verifyPayment = async (req,res)=>{
    try {
        const {razorpay_payment_id, razorpay_order_id, razorpay_signature} = req.body;
        console.log(req.body);
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            console.error('Missing required fields for verification');
            return res.status(400).json({ success: false, message: 'Incomplete payment data' });
        }
        const secret= process.env.RAZORPAY_KEY_SECRET;
        const generateSignature=crypto
        .createHmac('sha256',secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');
        console.log(generateSignature+'###with##'+razorpay_signature);

        if (generateSignature===razorpay_signature){
            console.log('Payment verified successfully');
            
            res.status(200).json({success:true})
        }else{
            
            console.error('Payment verification failed');
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
 


module.exports={
    getCheckOut,
    CheckOut,
    createPayment,
    verifyPayment
}