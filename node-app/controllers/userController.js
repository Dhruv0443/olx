const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const Users = mongoose.model('Users', {
    username: String,
    mobile: String,
    email: String,
    password: String,
    verified: { type: Boolean, default: false },
    likedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Products' }]
});

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user:"dhruvjain936@gmail.com",
        pass:"tapkmppcojrlnolw",// Your email password or app-specific password
    }
});

// Function to send verification email
const sendVerificationEmail = (user, token) => {
    const verificationUrl = `http://localhost:3000/signup`;

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: user.email,
        subject: 'Email Verification',
        html: `<p>Hi ${user.username},</p>
               <p>Please verify your email by clicking on the following link:</p>
               <a href="${verificationUrl}">${verificationUrl}</a>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

module.exports.likeProducts = (req, res) => {
    let productId = req.body.productId;
    let userId = req.body.userId;

    Users.updateOne({ _id: userId }, { $addToSet: { likedProducts: productId } })
        .then(() => {
            res.send({ message: 'liked success.' });
        })
        .catch(() => {
            res.send({ message: 'server err' });
        });
};

module.exports.signup = (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const user = new Users({ username, password, email, mobile });

    user.save()
        .then((result) => {
            // Create a token for email verification
            const token = jwt.sign({ userId: result._id }, 'MYKEY', { expiresIn: '1h' });
            
            // Send verification email
            sendVerificationEmail(result, token);

            res.send({ message: 'saved success. Please check your email to verify your account.' });
        })
        .catch(() => {
            res.send({ message: 'server err' });
        });
};

module.exports.verifyEmail = (req, res) => {
    const token = req.query.token;

    try {
        const decoded = jwt.verify(token, 'MYKEY');
        Users.updateOne({ _id: decoded.userId }, { $set: { verified: true } })
            .then(() => {
                res.redirect('http://localhost:3000/signup');
            })
            .catch(() => {
                res.send({ message: 'server err' });
            });
    } catch (err) {
        res.send({ message: 'Invalid or expired token.' });
    }
};

module.exports.myProfileById = (req, res) => {
    let uid = req.params.userId;

    Users.findOne({ _id: uid })
        .then((result) => {
            res.send({
                message: 'success.',
                user: {
                    email: result.email,
                    mobile: result.mobile,
                    username: result.username
                }
            });
        })
        .catch(() => {
            res.send({ message: 'server err' });
        });

    return;
};

module.exports.getUserById = (req, res) => {
    const _userId = req.params.uId;
    Users.findOne({ _id: _userId })
        .then((result) => {
            res.send({
                message: 'success.',
                user: {
                    email: result.email,
                    mobile: result.mobile,
                    username: result.username
                }
            });
        })
        .catch(() => {
            res.send({ message: 'server err' });
        });
};

module.exports.login = (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    Users.findOne({ username: username })
        .then((result) => {
            if (!result) {
                res.send({ message: 'user not found.' });
            } else {
                if (result.password == password) {
                    const token = jwt.sign({
                        data: result
                    }, 'MYKEY', { expiresIn: '1h' });
                    res.send({ message: 'find success.', token: token, userId: result._id });
                }
                if (result.password != password) {
                    res.send({ message: 'password wrong.' });
                }
            }
        })
        .catch(() => {
            res.send({ message: 'server err' });
        });
};

module.exports.likedProducts = (req, res) => {
    Users.findOne({ _id: req.body.userId }).populate('likedProducts')
        .then((result) => {
            res.send({ message: 'success', products: result.likedProducts });
        })
        .catch((err) => {
            res.send({ message: 'server err' });
        });
};
