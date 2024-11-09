const express = require('express');
const {userAuth,adminAuth}=require('../middlewares/auth')
const router=express.Router();
const userController = require('../controllers/user/userController');
const passport = require('passport');
const profileController = require('../controllers/user/profileController');

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

router.get('/productDetails',userController.getProductDetails)

router.get('/userProfile',userAuth,profileController.userProfile)
router.get('/address',userAuth,profileController.getAddress)

router.get('/addAddress',userAuth,profileController.addAddress)
router.post('/addAddress',userAuth,profileController.postAddAddress)

router.get('/editAddress',userAuth,profileController.editAddress)
router.post('/editAddress',userAuth,profileController.postEditAddress)

router.get('/deleteAddress',userAuth,profileController.deleteAddress)




module.exports=router 