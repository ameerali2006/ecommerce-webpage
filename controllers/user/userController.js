const User  = require('../../models/userSchema');
const nodemailer=require('nodemailer')
const env = require('dotenv').config()
const bcrypt = require('bcrypt');


const loadHomepage= async (req,res)=>{
    try {
        return res.render("home")
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
      const { name, phone, email, password, cpassword } = req.body;
  
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
      req.session.userData = { name, phone, email, password };
  
      res.render("verify-OTP");
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

            const saveUserData = new User({
                name: user.name,   
                email: user.email,
                phone: user.phone,
                password: passwordHash
            });

            await saveUserData.save();
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
 



 




module.exports={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp
}