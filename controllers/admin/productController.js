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
   
    try {
        
        const products=req.body;
        
        const productExists=await Product.findOne({
            productName:products.productName,
        })
        
        if(!productExists){
            const images=[];

            if(req.files&&req.files.length>0){
                console.log('ysss file is there')
                for(i=0;i<req.files.length;i++){
                    const originalImagePath=req.files[i].path
                    console.log('1st',originalImagePath);
                    
                    const resizeImagePath=path.join('public','uploads','re-image',`${path.parse(req.files[i].filename).name}-resized${path.extname(req.files[i].filename)}`);
                    console.log('2nd',resizeImagePath);
                    await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizeImagePath);
                    console.log('3rd');
                    images.push(`${path.parse(req.files[i].filename).name}-resized${path.extname(req.files[i].filename)}`)
                    console.log('4th',images);

                }
            }
            console.log(images);
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
                
                quantity:products.quantity,
                color:products.color,
             
                productImage:images,
                status:'Available'


                
            });


            await newProduct.save();
            return res.redirect('/admin/addProducts')
        }else{
            return res.status(400).json('product already exist,please ty with another name')

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
        const page=parseInt(req.query.page,10)||1;
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
        }).sort({createdAt:-1}).limit(limit*1).skip((page-1)*limit).populate('category').exec();
        console.log(productData);
        if(category && brand){
            res.render('products',{
                data:productData,
                currentPage:page,
                totalPages:Math.ceil(count/limit),
                category:category,
                brand:brand


            })
        }else{
            res.render('page-404')
        }
    
    
    
    } catch (error) {
        res.redirect('/admin/pageerror');

        
    }
}
const addProductOffer = async (req, res) => {
    try {
        const { productId, percentage } = req.body;
        console.log('start');

        // Find the product and its category
        const findProduct = await Product.findOne({ _id: productId });
        console.log('1');
        const findCategory = await Category.findOne({ _id: findProduct.category });

        // Check if the category already has an offer
        if (findCategory.categoryOffer > percentage) {
            console.log('2');
            return res.json({ status: false, message: "This product's category already has a category offer." });
        }

        // Calculate the discount and update sale price (subtract from the original price)
        const discount = Math.floor(findProduct.salePrice * (percentage / 100));
        findProduct.salePrice = findProduct.salePrice - discount;
        console.log('3');

        // Store the product offer percentage
        findProduct.productOffer = parseInt(percentage);
        console.log('4');

        await findProduct.save();
        console.log('5');

        // Reset the category offer to 0
        findCategory.categoryOffer = 0;
        await findCategory.save();
        console.log('6');

        res.json({ status: true });

    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror');
    }
};

const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;
        
        // Find the product to remove the offer
        const findProduct = await Product.findOne({ _id: productId });

        // Get the discount percentage and calculate the restored price
        const percentage = findProduct.productOffer;
        

        // Restore the original sale price
        findProduct.salePrice = ((findProduct.salePrice *100)/(100-percentage))

        // Remove the product offer
        findProduct.productOffer = 0;

        // Save the updated product
        await findProduct.save();

        res.json({ status: true });

    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror');
    }
};


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
            color:data.color,
             

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
        console.log(req.body);
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



