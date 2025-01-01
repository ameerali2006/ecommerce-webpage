const express = require('express');
const {userAuth,adminAuth}=require('../middlewares/auth')
const router=express.Router();
const userController = require('../controllers/user/userController');
const passport = require('passport');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController');
const User=require('../models/userSchema')
const checkOutController = require('../controllers/user/checkOutController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController');
const walletController = require('../controllers/user/walletController');

router.use(async(req, res, next) => {
    const userData = await User.findById(req.session.user);
    res.locals.user = userData || null;
    next();
});
router.use(async (req, res, next) => {
    if (req.path === "/login") {
        return next();
    }

    if (req.session.user) {
        const user = await User.findById(req.session.user);
        if (user && user.isBlocked) {
            return res.redirect("/login");
        } else if (user) {

            return next();
        }
    }
    next();
});

router.get('/pageNotFound',userController.pageNotFound)

router.get("/",userController.loadHomepage);

router.get('/signup',userController.loadSignup);

router.post('/signup',userController.signup)

router.post('/verify-otp',userController.verifyOtp);
router.post('/resend-otp',userController.resendOtp)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/sign'}),(req,res)=>{
    req.session.user=req.user;
    
    res.redirect('/')

})
router.get('/login',userController.loadLogin)
router.post('/login',userController.login) 

router.get('/logout',userController.logout)


router.get('/forgot-password',profileController.getForgotPassPage)
router.post('/forgot-email-valid',profileController.forgotEmailValid);
router.post('/verify-passForgot-otp',profileController.verifyForgotPassOtp)
router.get('/reset-password',profileController.getResetPasspage)
router.post('/resend-forgot-otp',profileController.resendOtp)
router.post('/reset-password',profileController.postNewPassword)

router.get('/sort-products',userAuth,userController.sortProducts);
router.get('/productDetails',userAuth,userController.getProductDetails)

router.get('/userProfile',userAuth,profileController.userProfile)
router.get('/address',userAuth,profileController.getAddress)

router.get('/addAddress',userAuth,profileController.addAddress)
router.post('/addAddress',userAuth,profileController.postAddAddress)

router.get('/editAddress',userAuth,profileController.editAddress)
router.post('/editAddress',userAuth,profileController.postEditAddress)

router.get('/deleteAddress',userAuth,profileController.deleteAddress)

router.post('/updateprofile',userAuth,profileController.updateProfile)

router.post('/addToCart',userAuth,cartController.addToCart)
router.get('/showCart',userAuth,cartController.getShowCart)
router.get('/showCart/remove',userAuth,cartController.removeFromCart)
router.get('/showCart/clearCart',userAuth,cartController.clearCart)
router.get('/showCart/checkStock',userAuth,cartController.checkStock)
router.post('/showCart/updateCartQuantity',userAuth,cartController.updateQuantity)

router.get('/getCheckOut',userAuth,checkOutController.getCheckOut)
router.post('/place-order-initial',userAuth,checkOutController.placeOrderInitial)
router.post('/postCheckOut',userAuth,checkOutController.CheckOut)
router.post('/createPayment',userAuth,checkOutController.createPayment)
router.post('/verify-payment',userAuth,checkOutController.verifyPayment)
router.post('/place-order',checkOutController.placeOrder);
router.post('/create-order',checkOutController.createOrder);
router.post('/retry-payment',checkOutController.retryPayment);
router.get('/order-confirmation',userAuth, checkOutController.orderConfirm)
router.get('/payment-failed',userAuth,checkOutController.paymentFailed);
router.post('/retry-payment',checkOutController.retryPayment);
router.get('/orders',userAuth,orderController.getOrders)
router.get('/order-details',userAuth,orderController.getOrderDetails)
router.post('/return-request',userAuth,orderController.returnRequest)
router.get('/cancel-order',userAuth,orderController.getOrderCancel)
router.get('/download-invoice',userAuth,orderController.downloadInvoice)
router.post('/apply-coupon',userAuth,orderController.applyCoupon)
router.post('/remove-coupon',userAuth,orderController.removeCoupon);
router.get('/addtoWishlist',userAuth,wishlistController.addToWishlist)
router.get('/wishlist',userAuth,wishlistController.getWishlist)
router.delete('/removeFromWishlist',userAuth,wishlistController.removeWishlist)

router.get('/coupons',userAuth,orderController.getCoupons)

router.get('/wallet',userAuth, walletController.loadWallet);
router.post('/create-wallet',userAuth,walletController.createWallet)
router.post('/verify-wallet',userAuth,walletController.verifyWallet)

router.get('/allProducts',userController.getAllProduct)
router.post('/wallet-payment',orderController.walletPayment);

router.get('/getFilteredData',userController.getFilterData)
router.get('/search',userController.search)
module.exports=router 