const Wallet=require('../../models/walletSchema')

const loadWallet= async (req,res)=>{
    try {
            const userId = req.session.user; // Logged-in user ID
            if (!userId) {
                return res.redirect('/login');
            }
    
            // Fetch wallet details for the user
            const wallet = await Wallet.findOne({ userId }).populate('transactions.orderId').lean();
    
            // If no wallet exists for the user, create an empty wallet
            if (!wallet) {
                return res.render('wallet', {
                    balance: 0,
                    transactions: [],
                });
            }
    
            // Render the wallet page with wallet data
            res.render('wallet', {
                balance: wallet.balance || 0,
                transactions: wallet.transactions || [],
            });
        } catch (error) {
            console.error('Error loading wallet page:', error);
            res.redirect('/pageNotFound');
        }
}

module.exports={
    loadWallet
}
