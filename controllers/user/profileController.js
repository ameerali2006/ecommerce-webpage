const User = require('../../models/userSchema')
const Address = require('../../models/addressSchema')

const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')
const env = require('dotenv').config();
const session = require('express-session');

function genrateOtp() {
    console.log('otp staryted');
    const digits = '1234567890';
    console.log(digits);
    let otp = '';
    for (let i = 0; i < 6; i++) {
        console.log(i);
        otp += digits[Math.floor(Math.random() * 10)]

    }
    console.log(otp);
    return otp;
}

const securePassword= async (password)=>{
    try {
        const passwordHash =await bcrypt.hash(password,10);
        return passwordHash
    } catch (error) {
        
    }
}

const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'your OTP for passwor reset ',
            text: `Your OTP is:${otp}`,
            html: `<b><h4>your OTP: ${otp}</h4><br></b> `
        }
        console.log('all most done');
        const info = await transporter.sendMail(mailOptions);
        console.log('all most2 done');

        console.log('Emailsend', info.messageId);
        console.log('all most 3done');

        return true




    } catch (error) {
        console.error('error on send maail');
        return false;

    }
}

const getForgotPassPage = async (req, res) => {
    try {
        res.render('forgot-password')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}
const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(req.body);
        const findUser = await User.findOne({ email: email,isBlocked:false })
        
        console.log(findUser);
        if (findUser) {
            console.log('next is otp');
            const otp = genrateOtp();
            console.log('after otp');

            const emailSend = await sendVerificationEmail(email, otp) 
            console.log(emailSend);
            console.log(otp);
            console.log('is it');
            if (emailSend) {
                console.log('sended');
                req.session.userOtp = otp;
                console.log(otp);

                req.session.email = email;
                console.log('something done');
                res.render('forgotPass-otp')
                console.log('"OTP', otp);
            } else {
                res.json({ success: false, message: 'failed to send Otp. please try again ' })
            }
        } else {
            res.render('forgot-password', { message: 'user with this email does not exist ' })

        }

    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

const verifyForgotPassOtp=async (req,res)=>{
    try {
        const enteredOtp= req.body.otp
        if(enteredOtp==req.session.userOtp){
            res.json({
                success:true,
                redirectUrl:'/reset-password'

            })
        }else{
            res.json({
                success:false,
                message:"OTP not matching"

            })
        }



    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).json({
            success:false,
            message:"An error occured. Please try again"

        })
    }
}
const getResetPasspage=async (req,res)=>{
    try {
        res.render('reset-password')
    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}

const resendOtp= async (req,res)=>{
    try {
        const otp =genrateOtp();
        req.session.userOtp=otp;
        const email =req.session.email;
        console.log('resending otp email:',email);
        const emailSend=await sendVerificationEmail(email,otp);
        if(emailSend){
            console.log('Resend Otp',otp);
            res.status(200).json({success:true,message:'Resend OTp Successfully'})
        }
    } catch (error) {
        console.error('error in resend otp',error);
        res.status(500).json({success:false,message:'internal server error'})

        
    }
}
const postNewPassword=async (req,res)=>{
    try {
        const {newPass1,newPass2}= req.body;
        const email= req.session.email;
        if(newPass1==newPass2){
            const passwordHash= await securePassword(newPass1)
            await User.updateOne({email:email},{$set:{password:passwordHash}})
            res.redirect('/login')
        }else{
            res.render('reset-password',{message:'Password not match'})
        }
    } catch (error) {
        res.redirect('/admin/pageerror')
        
    }
}

const userProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId)

        res.render('profile', { user: userData })
    } catch (error) {
        console.error('error is profile', error);
        res.redirect('/admin/pageerror')
    }
}

const getAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        const addressData = await Address.findOne({ userId: userId })
        if (!addressData) {
            res.redirect('/addAddress')
        }


        res.render('address', { address: addressData.address })
    } catch (error) {

    }
}
const addAddress = async (req, res) => {
    try {
        const user = req.session.user;
        res.render('add-address', { user: user })

    } catch (error) {
        res.redirect('/admin/pageerror')

    }
}
const postAddAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findOne({ _id: userId })
        console.log(req.body)
        const { addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body
        
        const userAddress = await Address.findOne({ userId: userData._id })
        if (!userAddress) {
            const newAddress = new Address({
                userId: userData._id,
                address: [{ addressType, name, city, landMark:landMark, state, pincode, phone, altPhone }]

            })
            await newAddress.save()
        } else {
            userAddress.address.push({ addressType, name, city, landMark:landMark, state, pincode, phone, altPhone })
            await userAddress.save()





        }
        res.redirect('/address')

    } catch (error) {
        console.error('error is addaddress', error);
        res.render('page-404')

    }
}

const editAddress = async (req, res) => {
    try {
        const addressId = req.query.id;
        const user = req.session.user;
        const currAddress = await Address.findOne({
            'address._id': addressId
        })
        if (!currAddress) {
            console.log('not currddress');
            return res.redirect('/pageerror')
        }
        const addressData = currAddress.address.find((item) => {
            return item._id.toString() == addressId.toString()
        })
        if (!addressData) {
            console.log('not addressData');
            return res.redirect('/pageerror')
        }

        res.render('editAddress', { address: addressData, user: user })


    } catch (error) {
        console.error('error in edit address', error);
        res.redirect('/pageerror')
    }

}
const postEditAddress = async (req, res) => {
    try {
        const data = req.body
        const addressId = req.query.id;
        const user = req.session.user
        const findAddress = await Address.findOne({ 'address._id': addressId })
        if (!findAddress) {
            res.redirect('pageerror')
        }
        await Address.updateOne({ 'address._id': addressId }, {
            $set: {
                'address.$': {
                    _id: addressId,
                    addressType: data.addressType,
                    name: data.name,
                    city: data.city,
                    landMark: data.lanndMark,
                    state: data.state,
                    pincode: data.pincode,
                    phone: data.phone,
                    altPhone: data.altPhone


                }
            }
        })
        res.redirect('address')
    } catch (error) {

    }
}
const deleteAddress= async (req,res)=>{
    try {
        const addressId=req.query.id;
        const findAddress=await  Address.findOne({ 'address._id': addressId })
        if(!findAddress){
            return res.status(404).send('address is not found')


        }

        await Address.updateOne({'address._id':addressId},{$pull:{address:{_id:addressId}}})

        res.redirect('/address')

    } catch (error) {
        console.error('error delete address');
        res.redirect('/admin/pageerror')
        
    }
}
const updateProfile=async (req,res)=>{
    try {
        const {dname,phone}=req.body;
        const userId=req.session.user;
        if(userId){
            const profileUpdate= await User.findByIdAndUpdate({_id:userId},{$set:{name:dname,phone:phone}},{new:true})
            if(profileUpdate){
                console.log('profile up');
    
                console.log('upateed success fully');
                res.redirect('/userProfile')
            }
        }else{
            console.log('user not found')
        }
        
    } catch (error) {
        console.error('error on updateprofile',error);
        res.redirect('/admin/pageerror')
        
    }
}

module.exports = {
    getForgotPassPage,
    forgotEmailValid,
    userProfile,
    getAddress,
    addAddress,
    postAddAddress,
    editAddress,
    postEditAddress,
    deleteAddress,
    verifyForgotPassOtp,
    getResetPasspage,
    resendOtp,
    postNewPassword,
    updateProfile
    



}

