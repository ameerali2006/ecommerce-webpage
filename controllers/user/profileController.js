const User =require('../../models/userSchema')
const nodemailer = require('nodemailer');
const bcrypt=require('bcrypt')
const env=require('dotenv').config();
const session=require('express-session');

function genrateOtp(){
    console.log('otp staryted');
    const digits='1234567890';
    console.log(digits);
    let otp='';
    for(let i=0;i<6;i++){
        console.log(i);
        otp+=digits[Math.floor(Math.random()*10)]
        
    }
    console.log(otp);
    return otp;
}



const sendVerificationEmail=async(email,otp)=>{
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

        const mailOptions={
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:'your OTP for passwor reset ',
            text:`Your OTP is:${otp}`,
            html:`<b><h4>your OTP: ${otp}</h4><br></b> `
        }
        console.log('all most done');
        const info=await  transporter.sendMail(mailOptions);
        console.log('all most2 done');

        console.log('Emailsend',info.messageId);
        console.log('all most 3done');

        return true




    } catch (error) {
       console.error('error on send maail');
       return false;
    
    }
}

const getForgotPassPage= async (req,res)=>{
    try {
        res.render('forgot-password')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}
const forgotEmailValid= async (req,res)=>{
    try {
        const {email}=req.body;
        console.log(req.body);
        const findUser=await User.findOne({email:email})
        console.log(findUser);
        if(findUser){
            console.log('next is otp');
            const otp = genrateOtp();
            console.log('after otp');
            
            const emailSend=await sendVerificationEmail(email,otp)
            console.log(emailSend);
            console.log(otp);
            console.log('is it');
            if(emailSend){
                console.log('sended');
                req.session.userOtp=otp;
                console.log(otp);

                req.session.email=email;
                console.log('something done');
                res.render('forgotPass-otp')
                console.log('"OTP',otp);
            }else{
                res.json({success:false,message:'failed to send Otp. please try again '})
            }
        }else{
            res.render('forgot-password',{message:'user with this email does not exist '})

        }

    } catch (error) {
        res.redirect('/pageNotFound')
    }
}



module.exports={
    getForgotPassPage,
    forgotEmailValid

}

