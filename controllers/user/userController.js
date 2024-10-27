const User  = require('../../models/userSchema');
const nodemailer=require('nodemailer')
const env = require('dotenv').config()


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
      const { username, phone, email, password, cpassword } = req.body;
  
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
      req.session.userData = { username, phone, email, password };
  
    //   res.render("verify-OTP");
      console.log("OTP sent", otp);
    } catch (error) {
      console.error("Signup eror", error);
      res.redirect("/pageNotFound");
    }
  };

 





module.exports={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup
}