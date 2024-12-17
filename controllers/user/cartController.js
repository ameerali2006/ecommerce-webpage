const User=require('../../models/userSchema')
const Cart=require('../../models/cartSchema')
const Product =require('../../models/productSchema')
const Category =require('../../models/categorySchema')


const addToCart = async (req, res) => {
    try {
        const productId = req.query.id;
        const qty = parseInt(req.body.quantity, 10);

        if (!req.session.user) {
            console.log('User not logged in. Redirecting to login page.');
            return res.redirect('/login');
        }

        const userId = req.session.user;
        const productData = await Product.findOne({ _id: productId });

        if (!productData) {
            console.log(`Product with ID ${productId} not found.`);
            return res.status(404).redirect('/pageNotFound');
        }

        if (productData.quantity < qty) {
            console.log(`Insufficient stock for product ID ${productId}.`);
            return res.redirect('/showCart');
        }

        const price = productData.salePrice;
        const totalPrice = price * qty;

        // Find user's cart
        let cart = await Cart.findOne({ userId });

        if (cart) {
            const productIndex = cart.items.findIndex(
                (item) => item.productId.toString() === productId
            );

            if (productIndex >= 0) {
                // Update existing product in cart
                const existingQuantity = cart.items[productIndex].quantity;

                if (productData.quantity < existingQuantity + qty ||(existingQuantity+qty)>5) {
                    console.log(
                        `Not enough stock to add ${qty} units for product ID ${productId}.`
                    );
                    return res.redirect('/showCart');
                }

                cart.items[productIndex].quantity += qty;
                cart.items[productIndex].totalPrice += totalPrice;

                console.log(
                    `Updated cart item: Product ID ${productId}, Quantity: ${cart.items[productIndex].quantity}, Total Price: ${cart.items[productIndex].totalPrice}`
                );
            } else {
                // Add new product to cart
                cart.items.push({ productId, quantity: qty, price, totalPrice });
                console.log(`Added new product ID ${productId} to cart.`);
            }
        } else {
            // Create a new cart
            cart = new Cart({
                userId,
                items: [{ productId, quantity: qty, price, totalPrice }],
            });
            console.log(`Created a new cart for user ID ${userId}.`);
        }

        // Save the updated cart
        await cart.save();
        console.log(`Cart saved successfully for user ID ${userId}.`);
        res.redirect('/showCart');
    } catch (error) {
        console.error('Error adding to cart:', error.message);
        res.redirect('/pageError');
    }
};


const getShowCart=async (req,res)=>{
    try {
        const userId=req.session.user;
        if(!userId){
            return res.redirect('/login')
        }
        const user = await User.findById(userId)
        const cartData= await Cart.findOne({userId:userId}).populate('items.productId')
        
        if(!cartData){
            return res.render('cart',{cart:null,products:[],totalAmt:0,user:user})
        }
        
        const totalAmt=cartData.items.reduce((sum,item)=>sum+item.totalPrice,0)
        
        res.render('cart',{cart:cartData,products:cartData.items,totalAmt,user:user})


    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror');

    }
}


const removeFromCart =async (req,res)=>{
    try {
        const userId = req.session.user;
        const productId=req.query.id;

        if(!userId){
            return res.redirect('/login')
        }
        const cart=await Cart.findOne({userId:userId})

        if(!cart){
            return res.redirect('/')
        }
        console.log('working');

        const prodIndex=cart.items.findIndex(item=>item.productId.toString() === productId)
        console.log('working2');
        console.log(prodIndex);

        if(prodIndex||prodIndex==0){
            cart.items.splice(prodIndex,1)
            console.log(cart.items);
            console.log('working3');


            await cart.save(); 
        }
        res.redirect('/showCart')
    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror')

        
    }
}
const clearCart= async (req,res)=>{
    try {
        const userId=req.session.user;
        if(!userId){
            return res.redirect('/login')
        }
        const cart=await Cart.findOne({userId:userId})
        if(cart){
            cart.items=[];
            await cart.save()
            res.redirect('/showCart')
           
        }else{
            res.redirect('/')
        }



    } catch (error) {
        console.error(error);
        res.render('page-404')
        
    }
}

const checkStock=async (req, res) => {
    const { id } = req.query;

    try {
        const product=await Product.findById(id)
        const availableStock = product.quantity; 

        res.json({ stock: availableStock });
    } catch (error) {
        console.error('Error checking stock:', error);
        res.status(500).json({ error: 'Failed to check stock' });
    }
};
const updateQuantity = async (req, res) => {
    const { productId, change } = req.body;
    try {

        const userId = req.session.user;
        if (!userId) {
            return res.json({ success: false, message: "User not logged in" });
        }

        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.json({ success: false, message: "Cart not found" });
        }

        const item = cart.items.find((item) => item.productId.toString() === productId);
        if (item) {
            item.quantity += change;
            item.totalPrice = item.quantity * item.price;

            if (item.quantity <= 0) {
                cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
            }

            cart.totalPrice = cart.items.reduce((total, item) => total + item.totalPrice, 0);
            await cart.save();

            res.json({
                success: true,
                newQuantity: item.quantity,
                newSubtotal: item.totalPrice,
                totalPrice: cart.totalPrice,
            });
        } else {
            res.json({ success: false, message: "Item not found in cart" });
        }

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Failed to update quantity" });
    }
};


module.exports={
    addToCart,
    getShowCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    checkStock,

} 