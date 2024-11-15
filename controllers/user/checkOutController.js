const User=require('../../models/userSchema')
const Cart=require('../../models/cartSchema')
const Product =require('../../models/productSchema')
const Category =require('../../models/categorySchema')
const Address =require('../../models/addressSchema')
const Order =require('../../models/orderSchema')



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
        const { payment_method, addressId, finalPrice } = req.body;
        console.log('Checkout process started');

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

        // Create the order
        const createOrder = new Order({
            orderedItems,
            user:userId,
            totalPrice: finalPrice,
            finalAmount: finalPrice,
            address: addressId,
            paymentMethod: payment_method,
            status:'pending'
        });

        
        console.log('Order created:', createOrder);

        // Save the order and handle errors if any
        await createOrder.save();
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



module.exports={
    getCheckOut,
    CheckOut
}