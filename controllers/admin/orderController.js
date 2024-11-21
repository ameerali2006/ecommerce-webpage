const User=require('../../models/userSchema')
const Order =require('../../models/orderSchema')
const Product =require('../../models/productSchema')
const Address = require('../../models/addressSchema')



const getAllorders=async (req,res)=>{
    try {
        const limit=5;
        const page=Math.max(1,parseInt(req.query.page)||1)
        const orders=await Order.find().populate('user').populate('orderedItems.product').limit(limit).skip((page-1)*limit);
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






module.exports={
    getAllorders,
    updateOrderStatus

}





