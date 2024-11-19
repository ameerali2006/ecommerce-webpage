
const Coupon =require('../../models/couponSchema')

const getCoupon= async (req,res)=>{
    try {
        const coupons=await Coupon.find().sort({createdOn:-1});
        res.render('addCoupon',{coupons})
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound')

    }
}
const addCoupon=async (req,res)=>{
    try {
        const  { name, expireOn, offerPrice, minimumPrice }=req.body;
        const newCoupon= new Coupon({
            name,
            expireOn,
            offerPrice,
            minimumPrice
            
        })
        await newCoupon.save()
        res.redirect('/admin/add-coupon')
    } catch (error) {
        console.error(error);
        
    }
}
const deleteCoupon=async (req,res)=>{
    try {
        const id=req.params.id;
        await Coupon.findByIdAndDelete(id)
        res.redirect('/admin/add-coupon')
    } catch (error) {
        console.error(error);
        
    }
}











module.exports={
    getCoupon,
    addCoupon,
    deleteCoupon

}


