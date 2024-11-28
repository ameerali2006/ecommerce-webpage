const express = require('express');
const app =express();
const path = require('path');
const env = require('dotenv').config();
const session=require('express-session')
const db = require('./config/db');
const userRouter = require('./routes/userRouter');
const passport = require('./config/passport');
const adminRouter = require('./routes/adminRouter');
const Category = require('./models/categorySchema');
db()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    } 
}))

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '-1');
    next();
  });

app.use(passport.initialize( ));
app.use(passport.session());

 // Assuming a Category model

// Middleware to set categories in res.locals
app.use(async (req, res, next) => {
    try {
        const categories = await Category.find(); // Fetch categories from the database
        res.locals.categories = categories; // Set categories to res.locals
        next(); // Proceed to the next middleware/route
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.locals.categories = []; // Default to an empty array if there's an error
        next();
    }
});


app.set('view engine','ejs')
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.use(express.static('public'))

app.use('/',userRouter) 
app.use('/admin',adminRouter)

  

app.listen(process.env.PORT,()=>{
    console.log('server running');
})

module.exports=app; 