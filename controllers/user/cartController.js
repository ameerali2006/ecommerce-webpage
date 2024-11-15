const User=require('../../models/userSchema')
const Cart=require('../../models/cartSchema')
const Product =require('../../models/productSchema')
const Category =require('../../models/categorySchema')

const addToCart=async (req,res)=>{
    try {
        const productId= req.query.id;
        const qty=parseInt(req.body.quantity,10) 
        const productData=await Product.findOne({_id:productId})
        
        if(!productData){
            console.log('not founded');
            return res.status(404).redirect('/admin/pageerror')
        }

        const recProducts=await Product.find({category:productData.category,_id:{$ne:productData.id}}).limit(4)
        const price=productData.salePrice;
        let totalPrice=price*qty
         
        
        const userId=req.session.user;
        const userData = await User.findOne({ _id: userId })
        
        if(!userId){
            console.log('user not found');
            res.redirect('/login')
        }
        
        const existCart=await Cart.findOne({userId:userId})
        
        if(existCart){
            const existProductIndex=existCart.items.findIndex(item=>item.productId.toString()===productId)
            if(existProductIndex>=0){
                existCart.items[existProductIndex].quantity+=qty
                existCart.items[existProductIndex].totalPrice+=totalPrice
                console.log(existCart.items[existProductIndex].quantity+=qty,existCart.items[existProductIndex].totalPrice+=totalPrice);
            }else{
                existCart.items.push({productId,quantity:qty,price,totalPrice})
            }
            await existCart.save()
            console.log(existCart);
        }else{
            const addcart=new Cart({
                userId:userData._id,
                items:[{productId,quantity:qty,price,totalPrice}]
            })
            
    
            console.log(addcart);
            await addcart.save()
        }
        
        
        


        
        
        
        res.redirect('/showCart')
    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror')
    }
}
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
const updateQuantity=async (req,res)=>{
    try {
        console.log('start');
        const {id,quantity}=req.query;
        console.log(id,quantity);
        const userId=req.session.user;
        console.log(userId);
        
        if(!userId){
            console.log('no user');

            return res.status(401).json({error:'User not loggind'}).redirect('/login')
        }
        const cart=await Cart.findOne({userId:userId})
        if(!cart){
            console.log('no cart');

            return res.status(404).json({error:'cart not found '}).redirect('/');

        }
        const index=cart.items.findIndex(item=>item.productId.toString()===id);
        console.log(index);

        if(index==-1){
            return res.status(404).json({error:'product is not find'}).redirect('/')
        }
        const newQuantity = parseInt(quantity, 10);
        if (isNaN(newQuantity) || newQuantity <= 0) {
            console.log('Invalid quantity:', quantity);
            return res.status(400).json({ error: 'Invalid quantity value' });
        }

        const salePrice = cart.items[index].price;
        if (isNaN(salePrice) || salePrice <= 0) {
            console.log('Invalid salePrice:', salePrice);
            return res.status(400).json({ error: 'Invalid price value for the product' });
        }
        cart.items[index].quantity=newQuantity;
        cart.items[index].totalPrice=salePrice*newQuantity
        await cart.save();
        console.log('saved');

        res.json({updateTotalPrice:cart.items[index].totalPrice})

    } catch (error) {
        console.error(error);
        res.status(500).json({error:'failed to update'})
        
    }
}



module.exports={
    addToCart,
    getShowCart,
    removeFromCart,
    clearCart,
    updateQuantity





}