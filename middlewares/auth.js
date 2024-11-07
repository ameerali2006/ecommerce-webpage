const User = require('../models/userSchema')
const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    next()
                } else {
                    res.redirect('/login')
                }
            })
            .catch(error => {
                console.log('Error in user auth middleare ');
                res.status(500).send('internal server error')
            })
    } else {
        res.redirect('/login')
    }
}
// const adminAuth = (req, res, next) => {
//     // Check if the user is authenticated and has a valid session
//     if (req.session && req.session.userId) {
//         // Find the logged-in user in the database and check if they are an admin
//         User.findById(req.session.userId)
//             .then(user => {
//                 if (user && user.isAdmin) {
//                     // Proceed to the next middleware if the user is an admin
//                     next();
//                 } else {
//                     // Redirect to the login page if the user is not an admin
//                     res.redirect('/admin/login');
//                 }
//             })
//             .catch(error => {
//                 console.error('Error in adminAuth middleware:', error);
//                 res.status(500).send('Internal server error');
//             });
//     } else {
//         // Redirect to login if no user session exists
//         res.redirect('/admin/login');
//     }
// };


const adminAuth = (req, res, next) => {

    if (req.session.admin) {
        User.findOne({ isAdmin: true })
            .then(data => {
                if (data) {
                    next()
                } else {
                    res.redirect('/admin/login')
                }
            })
            .catch(error => {
                console.log('error in adminauth middleware', error)
                res.status(500).send('internal server error')
            })

    }else{
        res.redirect('/admin/login')
    }


}
module.exports = {
    userAuth,
    adminAuth
}