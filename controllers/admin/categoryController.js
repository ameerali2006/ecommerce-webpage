const Category=require('../../models/categorySchema');



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
            return res.status(400).json({error:'Catorgry already exist'})
        }
        console.log('not exists')
        const newCategory=new Category({
            name,
            description
        })
        console.log('saves')

        await newCategory.save();
        res.json({message:'Category added successfully'})

    } catch (error) {
        console.log('error')
        return res.status(500).json({error:'Internal sserver Error'})
        
    }
}













module.exports={
    categoryInfo,
    addCategory

}





