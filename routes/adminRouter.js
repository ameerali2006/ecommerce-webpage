const express = require('express');
const router=express.Router();
const categoryController = require('../controllers/admin/categoryController');
const adminController=require('../controllers/admin/adminController')
const {userAuth,adminAuth}=require('../middlewares/auth')
const customerController=require('../controllers/admin/customerController')



router.get('/pageerror',adminController.pageerror)
router.get("/login",adminController.loadLogin);
router.post('/login',adminController.login)

router.get('/dashboard',adminAuth,adminController.loadDashboard)

router.get('/logout',adminController.logout)
// customer manegement
router.get('/users',adminAuth,customerController.customerInfo)
router.get('/blockCustomer',adminAuth,customerController.customerBlocked)
router.get('/unblockCustomer',adminAuth,customerController.customerunBlocked)
router.get('/category',adminAuth,categoryController.categoryInfo)
router.post('/addCategory',adminAuth,categoryController.addCategory)

router.post('/addCategoryOffer',adminAuth,categoryController.addCategoryOffer)
router.post('/removeCategoryOffer',adminAuth,categoryController.removeCategoryOffer)

router.get('/listCategory',adminAuth,categoryController.getlistCategory)
router.get('/unlistCategory',adminAuth,categoryController.getUnlistCategory)

router.get('/editCategory',adminAuth,categoryController.getEditCategory)
router.post('/editCategory/:id',adminAuth,categoryController.editCategory)
module.exports=router; 