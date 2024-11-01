const Swal = require('sweetalert2');
const Category=require('../../models/categorySchema');
const Product=require('../../models/productSchema');



const categoryInfo=async (req,res)=>{
    try {
        const page=parseInt(req.query.page)||1
        const limit =4;
        const skip=(page-1)*limit  
        const categoryData= await Category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)

        const totalCategories=await Category.countDocuments();
        const totalpages=Math.ceil(totalCategories/limit);
        res.render('category',{
            cat:categoryData,
            currentPage:page,
            totalPages:totalpages,
            totalCategories:totalCategories

        })




    } catch (error) {
        console.error(error)
        res.redirect('/pageerror')
        
    }
}
const addCategory=async (req,res)=>{
    const {name,description}=req.body
    try {
        console.log('started')
        const existingCategory=await Category.findOne({name});
        console.log(existingCategory)
        console.log('somthing')
        if(existingCategory){
            console.log('existing')
            return res.status(400).json({error:'Category already exists'})
        }
        console.log('not exists')
        const newCategory=new Category({
            name,
            description
        })
        console.log(newCategory)


        await newCategory.save();
        res.status(200).json({message:'Category added successfully'})

    } catch (error) {
        console.log('error')
        return res.status(500).json({error:'Internal sserver Error'})
        
    }
}

const addCategoryOffer= async (req,res)=>{
    try {
        console.log(req.body);
        const percentage=parseInt(req.body.percentage);
        console.log('satrt');
        const categoryId=req.body.categoryId;
        const category= await Category.findById(categoryId)
     
        console.log(categoryId);
        if(!category){
            return res.status(404).json({status:false,message:'Category not founded'})
        }
        const products=await Product.find({category:category._id})
        const hasProductOffer=products.some((product)=>product.productOffer>percentage)
        if(hasProductOffer){
            return res.json({status:false,message:'Product with this Category already have product offers'})

        }
        await Category.updateOne({_id:categoryId},{$set:{categoryOffer:percentage}})
        for(const product of products){
            product.productOffer=0;
            product.salePrice=product.regularPrice * (1-percentage/100);
            await product.save()
        }
        res.json({status:true})
    } catch (error) {
        res.status(500).json({status:false,message:'Intternal server issue'})
        
    }
}


const removeCategoryOffer=async (req,res)=>{
    try {
        const categoryId=req.body.categoryId;
        console.log(res.body);
        const category=await Category.findById(categoryId)
        if(!category){
            return res.status(404).json({status:false,message:'Category not found'})
        }
        const percentage=category.categoryOffer;
        const products=await Product.find({category:category._id})

        if(products.length> 0){
            for(const product of products){
                product.salePrice+=Math.floor(product.regularPrice*(percentage/100));
                product.productOffer=0 
                await product.save()
            }
        }
        category.categoryOffer=0;
        await category.save();
        res.json({status:true})
    } catch (error) {
        res.status(500).json({status:false,message:'internal error '})
    }
}

const getlistCategory= async (req,res)=>{
    try {
        let id=req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}})
        res.redirect('/admin/category')
    } catch (error) {
        res.redirect('/pageerror')
        
    }
}


const getUnlistCategory= async (req,res)=>{
    try {
        let id=req.query.id
        await Category.updateOne({_id:id},{$set:{isListed:true}})
        res.redirect('/admin/category')
    } catch (error) {
        res.redirect('/pageerror')
        
    }
}


const getEditCategory=async (req,res)=>{
    try {
        const id=req.query.id;
        const category=await Category.findOne({_id:id})
        res.render('edit-category',{category:category})
    } catch (error) {
        console.error('edit category error',error);
        res.redirect('/pageerror')
    }
}

const editCategory=async (req,res)=>{
    try {
        const id= req.params.id;
        console.log(id);
        const {categoryName,description}= req.body
        console.log(req.body);
        const existingCategory = await Category.findOne({ name: categoryName });
        console.log(existingCategory);
        if(existingCategory){
            console.log('existing');
            return res.status(400).json({error:'Category existing, please choose another name'})


        }
        console.log('not existing');
        console.log(categoryName);
        const updateCategory= await Category.findByIdAndUpdate(id,{name:categoryName,description:description},{new:true})
        console.log('update',updateCategory);
        if(updateCategory){
            res.redirect('/admin/category')
        }else{
            res.status(404).json({error:'Category not founded'})
        }
    } catch (error) {
        res.status(500).json({error:'Internal server error'})
    }
}


 




module.exports={
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    getlistCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory

 

}





