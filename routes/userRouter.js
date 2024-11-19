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

router.use(async(req, res, next) => {
    const userData = await User.findById(req.session.user);
    res.locals.user = userData || null;
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

router.get('/sort-products',userController.sortProducts);
router.get('/productDetails',userController.getProductDetails)

router.get('/userProfile',userAuth,profileController.userProfile)
router.get('/address',userAuth,profileController.getAddress)

router.get('/addAddress',userAuth,profileController.addAddress)
router.post('/addAddress',userAuth,profileController.postAddAddress)

router.get('/editAddress',userAuth,profileController.editAddress)
router.post('/editAddress',userAuth,profileController.postEditAddress)

router.get('/deleteAddress',userAuth,profileController.deleteAddress)

router.post('/updateprofile',userAuth,profileController.updateProfile)

router.post('/addToCart',userAuth,cartController.addToCart)
router.get('/showCart',cartController.getShowCart)
router.get('/showCart/remove',cartController.removeFromCart)
router.get('/showCart/clearCart',cartController.clearCart)
router.post('/showCart/updateCartQuantity',cartController.updateQuantity)

router.get('/getCheckOut',checkOutController.getCheckOut)
router.post('/postCheckOut',checkOutController.CheckOut)

router.get('/orders',orderController.getOrders)
router.get('/order-details',orderController.getOrderDetails)
router.get('/cancel-order',orderController.getOrderCancel)

router.post('/apply-coupon',orderController.applyCoupon)



module.exports=router 