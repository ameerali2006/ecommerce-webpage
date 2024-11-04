const Brand=require('../../models/brandSchema')
const Product =require('../../models/productSchema')






const getBrandPage=async (req,res)=>{
    try {
        const page= parseInt(req.query.page)||1;
        const limit =4;
        const skip = (page-1)*limit;
        const brandData= await Brand.find({}).sort({createdAt:-1}).skip(skip).limit(limit)
        const totalBrands=await Brand.countDocuments()
        const totalPages=Math.ceil()
        const reverseBrand=brandData.reverse();
        res.render('brands',{
            data:reverseBrand,
            currentPage:page,
            totalPages:totalPages,
            totalBrands:totalBrands



        })

    } catch (error) {
        res.redirect('/pageerror')
        
    }
}

const addBrand=async (req,res)=>{
    try {
        const brand=req.body.name;
        const findBrand= await Brand.findOne({brand});
        if(!findBrand){
            const image=req.file.filename;
            const newBrand=new Brand({
                brandName:brand,
                brandImage:image
            })
            await newBrand.save();
            res.redirect('/admin/brands')
        }
    } catch (error) {
        res.redirect('/pageerror')
        
    }
}

const blockBrand= async (req,res)=>{
    try {
        const id=req.query.id;
        if(!id){
            console.log('id is missing in block brand')
            return res.status(400).redirect('/pageerror')
        }
        await Brand.updateOne({_id:id},{$set:{isBlock:true}})
        res.redirect('/admin/brands')
    } catch (error) {
        res.status(400).redirect('/pageerror')
    }
}

const unBlockBrand= async (req,res)=>{
    try {
        const id=req.query.id;
        if(!id){
            console.log('id is missing in unblockbrand')
            return res.status(400).redirect('/pageerror')
        }
        await Brand.updateOne({_id:id},{$set:{isBlock:false}})
        res.redirect('/admin/brands')
    } catch (error) {
        res.status(400).redirect('/pageerror')
    }
}

const deleteBrand= async (req,res)=>{
    try {
        const id=req.query.id;
        if(!id){
            console.log('id is missing in delete brand')
            return res.status(400).redirect('/pageerror')
        }
        await Brand.findByIdAndDelete(id)
        res.redirect('/admin/brands')
    } catch (error) {
        res.status(400).redirect('/pageerror')
    }
}

 module.exports={
    getBrandPage,
    addBrand,
    unBlockBrand,
    blockBrand,
    deleteBrand



 }