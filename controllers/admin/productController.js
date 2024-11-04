const Product=require('../../models/productSchema')
const Category=require('../../models/categorySchema')
const Brand=require('../../models/brandSchema')
const User=require('../../models/userSchema')
const path= require('path')
const fs=require('fs')
const sharp=require('sharp')
const { json } = require('express')




const getProductAddPage= async (req,res)=>{
    try {
        const category=await Category.find({isListed:true})
        const brand=await Brand.find({isBlock:false})
        res.render('product-add',{
            cat:category,
            brand:brand
        });
    } catch (error) {
        res.redirect('/pageerror')
    }
}
const addProducts=async (req,res)=>{
    console.log('str');
    try {
        console.log('start');
        const products=req.body;
        console.log(req.body);
        const productExists=await Product.findOne({
            productName:products.productName,
        })
        console.log('cheking');
        if(!productExists){
            const images=[];

            if(req.file&&req.files.length>0){
                for(i=0;i<req.files.length;i++){
                    const originalImagePath=req.files[i].path

                    const resizeImagePath=path.join('public','uploads','product-images',req.files[i].filename);
                    await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizeImagePath);
                    images.push(req.files[i].filename)
                }
            }
            const categoryId=await Category.findOne({name:products.category})
            if(!categoryId){
                return res.status(400).json('Invalid category name')
            }
            const newProduct=new Product({
                productName:products.productName,
                description:products.description,
                brand:products.brand,
                category:categoryId._id,
                regularPrice:products.regularPrice,
                salePrice:products.salePrice,
                // createdAt:new Date(),
                quantity:products.quantity,
                color:products.color,
                // size:products.size,
                productImage:images,
                status:'Available'


                
            });


            await newProduct.save();
            return res.redirect('/admin/addProducts')
        }else{
            return res.status(400).jsoon('product already exist,please ty with another name')

        }
    } catch (error) {
        console.error('error savind product',error)
        return res.redirect('/pageerror')
        
    }
}
const getAllProducts=async (req,res)=>{
    try {
        console.log('start');
        const search= req.query.search||'';
        console.log(search);
        const page=req.query.page||1;
        console.log(page);
        const limit=4
        console.log(limit);
        const count=await Product.find({
            $or:[
                {productName:{$regex:new RegExp('.*'+search+'.*','i')}},
                {brand:{$regex:new RegExp('.*'+search+'.*','i')}},
            ]
        }).countDocuments();
        console.log('working');
        console.log(count);

        const category =await Category.find({isListed:true});
        console.log(category);
        const brand=await Brand.find({isBlock:false})
        console.log(brand);
        const productData =await Product.find({
            $or:[
                {productName:{$regex:new RegExp('.*'+search+'.*','i')}},
                {brand:{$regex:new RegExp('.*'+search+'.*','i')}},
            ]
        }).limit(limit*1).skip((page-1)*limit).populate('category').exec();
        console.log(productData);
        if(category && brand){
            res.render('products',{
                data:productData,
                currentPage:page,
                totalPages:Math.ceil(count/limit),
                cat:category,
                brand:brand


            })
        }else{
            res.render('page-404')
        }
    
    
    
    } catch (error) {
        res.redirect('/admin/pageerror');

        
    }
}
const addProductOffer= async (req,res)=>{
    try {
        const {productId,percentage}=req.body;
        console.log('start');
        const findProduct=await Product.findOne({_id:productId});
        console.log('1');
        const findCategory=await Category.findOne({_id:findProduct.category});
        if(findCategory.categoryOffer>percentage){
            console.log('  2 ');
            return res.json({status:false,message:"this products category already has a category offer"})
        }
        findProduct.salePrice=findProduct.salePrice-Math.floor(findProduct.salePrice*(percentage/100))
        console.log(' 3  ');

        findProduct.productOffer=parseInt(percentage);
        console.log(' 4  ');

        await findProduct.save();
        console.log('  4 ');

        findCategory.categoryOffer=0;
        console.log('5   ');

        await findCategory.save();
        console.log(' 6  ');

        res.json({status:true});

    } catch (error) {

        res.redirect('/admin/pageerror')
        
        
    }
}
const removeProductOffer= async (req,res)=>{
    try {
        const {productId}=req.body;
        const findProduct=await Product.findOne({_id:productId});
        const percentage=findProduct.productOffer;
        findProduct.salePrice=findProduct.salePrice+Math.floor(findProduct.salePrice*(percentage/100))
        findProduct.productOffer=0;
        await findProduct.save();
        res.json({status:true});





    } catch (error) {
        res.redirect('/admin/pageerror')
        
    }
}

const blockProduct= async (req,res)=>{
    try {
        
        let id=req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlock:true}})
        res.redirect('/admin/products')




    } catch (error) {
        res.redirect('/admin/pageerror')
        
    }
}
const unBlockProduct= async (req,res)=>{
    try {
        
        let id=req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlock:false}})
        res.redirect('/admin/products')




    } catch (error) {
        res.redirect('/admin/pageerror')
        
    }
}
const getEditProduct= async (req,res)=>{
    try {
        const id=req.query.id;
        console.log('1');
        const product =await Product.findOne({_id:id})
        console.log(' 3  ');
        const category=await Category.find({})
        console.log(' 4  ');

        const brand=await Brand.find({});
        console.log(' 5  ');

        res.render('edit-product',{
            product:product,
            cat:category,
            brand:brand,

        })
        
        



    } catch (error) {
        console.error('enthannu error',error);
        res.redirect('/admin/pageerror')
        
    }
}

const editProduct= async (req,res)=>{
    try {
        const id=req.params.id;
        console.log(id);
        const product =await Product.findOne({_id:id})
        const data=req.body
        const existingProduct=await Product.findOne({
            productName:data.productName,
            _id:{$ne:id}
        })
        if(existingProduct){
            return res.status(400).json({error:'product with this name already exsting.Please ty with another name'})

        }
        const images=[];
        if(req.files && req.files.length>0){
            for(let i=0;i<req.files.length;i++){
                images.push(req.files[i].filename);
            }
        }
        const updateField= {
            productName:data.productName,
            description:data.description,
            brand:data.brand,
            category:product.category,
            regularPrice:data.regularPrice,
            salePrice:data.salePrice,
            quantity:data.quantity,
            color:data.color

        }
        if(req.files.length>0){
            updateField.$push={productImage:{$each:images}}
        }
        await Product.findByIdAndUpdate(id,updateField,{new:true})
        res.redirect('/admin/products')
    } catch (error) {
        console.error(error)
        redirect('/admin/pageerror')
        
    }
}
const deleteSingleImage=async (req,res)=>{
    try {
        const {imageNameToServer,productIdToServer}=req.body;
        const product =await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}})
        const imagePath=path.join('public','uploads','re-image',imageNameToServer)
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath)
            console.log(`image ${imageNameToServer} deleted successfully `);
        }else{
            console.log(`Imaage ${imageNameToServer} not found`);
        }
        res.send({status:true})


    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}




module.exports={
    getProductAddPage,
    addProducts,
    getAllProducts,
    addProductOffer,
    removeProductOffer,
    unBlockProduct,
    blockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage
    
}



