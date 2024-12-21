const User  = require('../../models/userSchema');
const nodemailer=require('nodemailer')
const env = require('dotenv').config()
const bcrypt = require('bcrypt');
const Category =require('../../models/categorySchema')
const Product =require('../../models/productSchema')
const Wallet =require('../../models/walletSchema')
const Wishlist =require('../../models/wishlistSchema')

function generateReferalCode(length) {
  let result = '';
  const characters = 'abcdef0123456789';

  for (let i = 0; i < length; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }

  return result;

}


const search=async (req,res)=>{
    try {
        const user =req.session.user
        const {category,query}= req.query;
        let searchItems={}
        console.log(req.query);
        if(category && category!=='all'){
            
            searchItems.category=category;

        }
        searchItems.productName={$regex:query,$options:'i'}
        searchItems.isBlock=false
        const results = await Product.find(searchItems)
        let wishlistProductIds = [];
        if (user) {
            const wishlist = await Wishlist.findOne({ userId: user }, { 'products.productId': 1, _id: 0 });
            wishlistProductIds = wishlist ? wishlist.products.map(item => item.productId.toString()) : [];
        }
       
        res.render('search', { results, query, category,wishlistProductIds });
    } catch (error) {
        console.error(error);
    }
}

const loadHomepage= async (req,res)=>{
    try {
        const user = req.session.user
        
        const categories=await Category.find({isListed:true})
         

        let productData=await Product.find({isBlock:false,category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}}).populate('category','name')
          

        productData.sort((a,b)=>new Date(b.createOn)-new Date(a.createOn))
         

        productData=productData.slice(0)
        let wishlistProductIds = [];
        if (user) {
            const wishlist = await Wishlist.findOne({ userId: user }, { 'products.productId': 1, _id: 0 });
            wishlistProductIds = wishlist ? wishlist.products.map(item => item.productId.toString()) : [];
        }
        

        if(user){
             

            const userData=await User.findOne({_id:user})
            res.render('home',{user:userData,products:productData,wishlistProductIds})
        }else{
            return res.render('home',{products:productData,wishlistProductIds})
        }
        
    } catch (error) {
        console.log('home page is not found');
        res.status(500).send("server error")
    }
}   

const pageNotFound= async (req,res)=>{
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}


const loadSignup= async (req,res)=>{
    try {
        res.render("signup")
    } catch (error) {
        console.log('home page is not found');
        res.status(500).send("server error")
    }
}



function generateOtp(){
    return Math.floor(100000+Math.random()*900000).toString()
}
async function sendVerificationEmail(email,otp) {
    try {
        const transporter=nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD

            }
        })
        const info=await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:'Verify your account',
            text:`your OTP is ${otp} `,
            html:`<b>your OTP:${otp}`

        })
        return info.accepted.length >0
    } catch (error) {
        console.error("send email error ")
        return false
        
    }
    
}

const signup = async (req, res) => {
    try {
      const { name, phone, email, password, cpassword,referal } = req.body;
  
      if (password != cpassword) {
        return res.render("signup", { message: "Passwords do not match" });
      }
  
      const findUser = await User.findOne({ email });
      if (findUser) {
        return res.render("signup", {
          message: "User with this email already exists",
        });
      }
  
      const otp = generateOtp();
      console.log(email)
      const emailSent = await sendVerificationEmail(email, otp);
  
      if (!emailSent) {
        return res.json("email-error");
      }
    
      req.session.userOtp = otp;
      req.session.userData = { name, phone, email, password ,referal};
  
      res.render("verify-otp");
      console.log("OTP sent", otp);
    } catch (error) {
      console.error("Signup eror", error);
      res.redirect("/pageNotFound");
    }
  };
  


const securePassword=async (password)=>{
    const salt= 10
    try {
        const passwordHash=await bcrypt.hash(password,salt)
        return passwordHash
    } catch (error) {
        console.error("Error hashing password:", error);
        
    }
}  

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log("User entered OTP:", otp);
        console.log("Session OTP:", req.session.userOtp);

        if (otp ==req.session.userOtp) {
            const user = req.session.userData;
            console.log(user)
            const passwordHash = await securePassword(user.password);
            const referalCode = generateReferalCode(8);

            let refererBonus = 120;
            let newUserBonus = 100;
            if (user.referal) {
                const refererUser = await User.findOne({ referalCode: user.referal });
        
                if (refererUser) {
                  await Wallet.findOneAndUpdate(
                    { userId: refererUser._id },
                    {
                      $inc: { balance: refererBonus },
                      $push: {
                        transactions: {
                          type: "Referal",
                          amount: refererBonus,
                          description: "Referral bonus for referring a new user"
                        }
                      }
                    },
                    { upsert: true }
                  );
                }
            }
            const saveUserData = new User({
                name: user.name,   
                email: user.email,
                phone: user.phone,
                password: passwordHash,
                referalCode
            });

            await saveUserData.save();
            await Wallet.create({
                userId: saveUserData._id,
                balance: user.referal ? newUserBonus : 0,
                transactions: user.referal
                  ? [{
                    type: "Referal",
                    amount: newUserBonus,
                    description: "Referral bonus for signing up with a referral code"
                  }]
                  : []
              });
            req.session.user = saveUserData._id;

            return res.json({
                success: true,
                redirectUrl: '/'
            });

        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid OTP, please try again'
            });
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

const resendOtp =async (req,res)=>{
    try {
        const {email}=req.session.userData;
        if(!email){
            return res.status(400).json({
                success:false,
                message:'Email not found in session'})
        }
        const otp=generateOtp();
        req.session.userOtp=otp
        const emailSend= await sendVerificationEmail(email,otp)
        console.log('send mail')
        if(emailSend){
            console.log('resnd otp:',otp)
            res.status(200).json({success:true,message:'otp Resend successfully'})
        }else{
            res.status(500).json({success:false,
                message:'Failed to resend otp. please try again'
            })
        }
        
    } catch (error) {
        console.error('errorn on resend otp',error);
        res.status(500).json({success:false,
            message:'internal server error'
        })

        
    }

}


const loadLogin=async(req,res)=>{
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            if (user && user.isBlocked) {
              req.session.user = null;
              return res.render("login", { message: "User is blocked" });
            }
            return res.redirect("/");
          } else {
            return res.render("login", { message: '' });
          }
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }

}

const login=async (req,res)=>{
    try {
        const{email,password}=req.body

        const findUser=await User.findOne({isAdmin:0,email:email})
        if(!findUser){
            return res.render('login',{message:'User not Found'})

        }
        if(findUser.isBlocked){
            return res.render('login',{message:'User is block By admin'})
        }
        const passwordMatch= await bcrypt.compare(password, findUser.password)
        if(!passwordMatch){
            return res.render('login',{message:'incorrect Pssword'})

        }
        req.session.user=findUser._id;
        res.redirect('/')



    } catch (error) {
        console.error('login errror',error)
        res.render('login',{message:'login failed, please try again'})
        
    }

}
 
const logout=async (req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log('session destruction error',err.message)
                return res.redirect('/pageNotFound')
            }
            return res.redirect('login')
        })
    } catch (error) {
        console.log('logout error',error);
        res.redirect('/pageNotFound')
        
    }
}

const getProductDetails= async (req,res)=>{
    try {
        const id=req.query.id;
        const user=req.session.user
        console.log(id);
        const productData=await Product.findOne({_id:id})
        const recProducts=await Product.find({category:productData.category,_id:{$ne:productData.id}}).limit(4)
        if(!productData){
            console.log('not founded');
            return res.status(404).redirect('/admin/pageerror')
        }
        let wishlistProductIds = [];
        if (user) {
            const wishlist = await Wishlist.findOne({ userId: user }, { 'products.productId': 1, _id: 0 });
            wishlistProductIds = wishlist ? wishlist.products.map(item => item.productId.toString()) : [];
            return res.render('product-details',{data:productData,recData:recProducts,wishlistProductIds})

        }
        res.render('product-details',{data:productData,recData:recProducts})
    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}

const sortProducts= async (req,res)=>{
    try {
        console.log('dsorting')
        const { sortBy } = req.query;
        let sortQuery = {};

        switch (sortBy) {
            case 'price-low':
                sortQuery = { salePrice: 1 };
                break;
            case 'price-high':
                sortQuery = { salePrice: -1 };
                break;
            case 'az':
                sortQuery = { productName: 1 };
                break;
            case 'za':
                sortQuery = { productName: -1 };
                break;
            case 'new':
                sortQuery = { createdAt: -1 };
                break;
            case 'popularity':
                // Assuming you have a field tracking product views or sales
                sortQuery = { popularityScore: -1 };
                break;
            case 'rating':
                // Assuming you have a field for average ratings
                sortQuery = { averageRating: -1 };
                break;
            case 'featured':
                // Assuming you have a boolean field for featured products
                sortQuery = { isFeatured: -1 };
                break;
            default:
                sortQuery = {createdAt: -1};
        }

        const products = await Product.find()
            .populate('category')
            .sort(sortQuery)
            .exec();

        res.json(products);
    } catch (error) {
        console.error('Error sorting products:', error);
        res.status(500).json({ error: 'Failed to sort products' });
    }
}
const getAllProduct = async (req, res) => {
    try {
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });

        // Get filter parameters
        const { category, minPrice, maxPrice, page = 1 } = req.query;
        const limit = 8; // Number of products per page
        const skip = (page - 1) * limit;

        // Build filter conditions
        let filterConditions = { isBlock: false, quantity: { $gt: 0 } };

        if (category) filterConditions.category = category;
        if (minPrice || maxPrice) {
            filterConditions.salePrice = {};
            if (minPrice) filterConditions.salePrice.$gte = parseFloat(minPrice);
            if (maxPrice) filterConditions.salePrice.$lte = parseFloat(maxPrice);
        }

        const totalProducts = await Product.countDocuments(filterConditions);
        const productData = await Product.find(filterConditions)
            .populate('category', 'name')
            .sort({ createOn: -1 }) // Newest first
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalProducts / limit);

        let wishlistProductIds = [];
        if (user) {
            const wishlist = await Wishlist.findOne({ userId: user }, { 'products.productId': 1, _id: 0 });
            wishlistProductIds = wishlist ? wishlist.products.map(item => item.productId.toString()) : [];
        }
        console.log(productData);

        res.render('shop', {
            user,
            products: productData,
            totalPages,
            currentPage: parseInt(page),
            wishlistProductIds,
            categories,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.redirect('/pageNotFound');
    }
};

const  getFilterData=async (req, res) => {
    const { category = 'all', search = '', sort = 'default' } = req.query;

    try {
        const categoryId=await Category.findOne({name:category})
        // Build a query object
        const query = category === 'all' ? {} : { category:categoryId._id };
        

        // Add search filter to the query
        if (search) {
            query.productName = { $regex: search, $options: 'i' }; // Case-insensitive search
        }
        query.isBlock=false;

        // Determine the sort order
        let sortCriteria = {};
        switch (sort) {
            
            case 'price-low':
                sortCriteria.salePrice = 1; // Ascending
                break;
            case 'price-high':
                sortCriteria.salePrice = -1; // Descending
                break;
            
            case 'az':
                sortCriteria.productName = 1; // Alphabetical A-Z
                break;
            case 'za':
                sortCriteria.productName = -1; // Alphabetical Z-A
                break;
            case 'new':
                sortCriteria.createdAt = -1; // Newest first
                break;
            default:
                sortCriteria = {}; // Default sorting (no specific order)
        }

        // Fetch products with filtering and sorting applied
        const products = await Product.find(query).sort(sortCriteria);

        // Send the filtered and sorted products as JSON
        res.json({
            success: true,
            products, 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching products',
            error: error.message,
        });
    }
}


  




module.exports={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    getProductDetails,
    sortProducts,
    search, 
    getAllProduct,
    getFilterData
}