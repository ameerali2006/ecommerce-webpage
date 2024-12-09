const User=require('../../models/userSchema')
const Order =require('../../models/orderSchema')
const Product =require('../../models/productSchema')
const Address = require('../../models/addressSchema')



const getAllorders=async (req,res)=>{
    try {
        const limit=5;
        const page=Math.max(1,parseInt(req.query.page)||1)
        const orders=(await Order.find().sort({createdOn:-1}).populate('user').populate('orderedItems.product').limit(limit).skip((page-1)*limit));
        const count=await Order.countDocuments()
        res.render('orders',{orders,totalPages:Math.ceil(count/limit),currentPage:page})
    } catch (error) {
        console.error(error);
        res.redirect('admin/pageerror')
        
    }
}
const updateOrderStatus = async (req, res) => {
    const { orderId, newStatus } = req.body;
    try {
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = newStatus;
        await order.save();

        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};

const getSaleReport=async (req,res)=>{
    try {
        const {page=1,limit=10,startDate,endDate}=req.query;
        const filter={};

        if(startDate||endDate){
            filter.createdOn={};
            if(startDate)filter.createdOn.$gte=new Date(startDate);
            if(endDate)filter.createsOn.$lte=new Date(endDate)
        }

        const orders=await Order.find(filter).populate('user').populate('orderedItems.product').sort({createdOn:-1}).skip((page-1)*limit).limit(parseInt(limit))
        const totalSales= await Order.aggregate([{$match:filter},{$group:{_id:null,total:{$sum:'$finalAmount'}}}]);
        const totalDiscount=await Order.aggregate([{$match:filter},{$group:{_id:null,total:{$sum:'$discount'}}}]);
        const uniqueCustomers=await Order.distinct('user',filter);
        const totalOrders=await Order.countDocuments(filter);

        res.render('salesReport',{
            orders,
            totalSales:totalSales[0]?.total||0,
            totalDiscount:totalDiscount[0]?.total || 0,
            uniqueCustomers: uniqueCustomers.length,
            count: totalOrders,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrders / limit),
            limit: parseInt(limit)
        })




    } catch (error) {
        
    }
}






module.exports={
    getAllorders,
    updateOrderStatus,
    getSaleReport

}





