const express = require('express');
const router=express.Router();
const categoryController = require('../controllers/admin/categoryController');
const adminController=require('../controllers/admin/adminController')
const {userAuth,adminAuth}=require('../middlewares/auth')
const customerController=require('../controllers/admin/customerController')
const brandController=require('../controllers/admin/brandController')
const productController=require('../controllers/admin/productController')
const orderController=require('../controllers/admin/orderController')
const couponController=require('../controllers/admin/couponController')
const stockController=require('../controllers/admin/stockController')


const multer=require('multer');
const storage=require('../helpers/multer')
const uploads=multer({storage:storage})


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



// brand maneger
router.get('/brands',adminAuth,brandController.getBrandPage)
router.post('/addBrand',adminAuth,uploads.single('image'),brandController.addBrand)
router.get('/blockBrand',adminAuth,brandController.blockBrand)
router.get('/unBlockBrand',adminAuth,brandController.unBlockBrand)
router.get('/deleteBrand',adminAuth,brandController.deleteBrand)

// product manegement
router.get('/addProducts',adminAuth,productController.getProductAddPage);
router.post('/addProducts',adminAuth,uploads.array('images',4),productController.addProducts)
router.get('/products',adminAuth,productController.getAllProducts)
router.post('/addProductOffer',adminAuth,productController.addProductOffer);
router.post('/removeProductOffer',adminAuth,productController.removeProductOffer);

router.get('/blockProduct',adminAuth,productController.blockProduct);
router.get('/unBlockProduct',adminAuth,productController.unBlockProduct)
router.get('/editProduct',adminAuth,productController.getEditProduct)
router.post('/editProduct/:id',adminAuth,uploads.array('images',4),productController.editProduct)
router.post('/deleteImage',adminAuth,productController.deleteSingleImage);

// order Manegement
router.get('/allOrders',orderController.getAllorders);
router.post('/update-order-status', orderController.updateOrderStatus);



// coupon manegement 
router.get('/add-coupon',couponController.getCoupon)
router.post('/add-coupon',couponController.addCoupon)
router.get('/delete-coupon/:id',couponController.deleteCoupon)


router.get('/stockManagement',stockController.getStocks)
router.post('/update-stock',stockController.updateStock)

router.get('/saleReport',orderController.getSaleReport)






module.exports=router; 