const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const multer = require("multer");
const morgan = require("morgan");
const postmark = require("postmark");
const app = express()



const { ServerSecretKey, PORT } = require("./core/index")
const { order, otpModel, childcomment } = require('./dbase/modules')
const serviceAccount = require("./firebase/firebase.json");
const client = new postmark.Client("fa2f6eae-eaa6-4389-98f0-002e6fc5b900");
// var client = new postmark.Client("ENTER YOUR POSTMARK TOKEN");




app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(express.json())
app.use(morgan('short'))




const storage = multer.diskStorage({ // https://www.npmjs.com/package/multer#diskstorage
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, `${new Date().getTime()}-${file.filename}.${file.mimetype.split("/")[1]}`)
    }
})

const upload = multer({ storage: storage })

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://toys-97d91-default-rtdb.firebaseio.com"
});

const bucket = admin.storage().bucket("gs://toys-97d91.appspot.com");





//  Firebase Imag Upload

app.post("/upload", upload.any(), (req, res, next) => {  // never use upload.single. see https://github.com/expressjs/multer/issues/799#issuecomment-586526877

    bucket.upload(
        req.files[0].path,
        function (err, file, apiResponse) {
            if (!err) {
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                }).then((urlData, err) => {
                    if (!err) {

                        console.log(urlData[0], "urlData[0]");
                        // getUser.findById(req.headers.jToken.id, (err, userData) => {
                        //     userData.update({ profileUrl: urlData[0] }, (err, updated) => {
                        //         if (!err) {
                        //             res.status(200).send({
                        //                 profileUrl: urlData[0],
                        //             })
                        //         }
                        //     })
                        // })
                    }
                })
            } else {
                console.log("err: ", err)
                res.status(500).send();
            }
        });
})




app.post("/Clientdata", (req, res, next) => {

    if (!req.body.ClientId
        || !req.body.clientName
        || !req.body.clientEmail
        || !req.body.clientAmount
    ) {
        res.status(409).send(`
                    Please send useremail and tweet in json body
                    e.g:
                    "productKey":"productKey",
                    "productname": "productname",
                    "price": "price",
                    "stock": "stock",
                    "description": description,
                    // "img": "im",
                `)
        return;
    } else {
        const newUser = new order({
            ClientId: req.body.ClientId,  // user.clientID 
            ClientName: req.body.clientName,  // user.clientName 
            email: req.body.clientEmail,  // user.clientEmail 
            Amount: req.body.clientAmount,  // user.clientAmount 
            status: "false"  // user.clientAmount 
        })
        newUser.save().then((data) => {
            res.send(data)
        })
            .catch((err) => {
                res.status(500).send({
                    message: "an error occured : " + err,
                })
            });
    }
})


app.post('/sendOtp', upload.any(), (req, res, next) => { // order id pa send hu gai otp

    if (!req.body.ClientId) {  //!req.body.imageUrl
        res.status(403).send(`
        please send email in json body.
        e.g:
        {
            "email": "Razamalik468@gmail.com"
        }`)
        return;
    } else {


        order.findOne({ ClientId: req.body.ClientId },
            function (err, user) {
                if (err) {

                    res.status(500).send({
                        message: "an error occured: " + JSON.stringify(err)
                    });
                } else if (user) {


                    var a = order.updateOne({ imageUrl: req.body.imageUrl })

                    const otp = Math.floor(getRandomArbitrary(11111, 99999))
                    otpModel.create({
                        email: user.email,  // User Email
                        otpCode: otp
                    }).then((doc) => {
                        client.sendEmail({
                            "From": "faiz_student@sysborg.com",
                            "To": user.email,
                            "Subject": "Reset your password",
                            "TextBody": `Here is your pasword reset code: ${otp}`
                        })
                    }).then((status) => {
                        console.log("status: ", status);
                        res.send
                            ({
                                message: "email sent with otp",
                            })
                    }).catch((err) => {
                        console.log("error in creating otp: ", err);
                        res.status(500).send("unexpected error ")
                    })


                } else {
                    res.status(403).send({
                        message: "user not found"
                    });
                }
            })
    }
})


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

app.post('/ReciveOtpStep-2', (req, res, next) => {

    
    if (!req.body.ClientId // order id required 
        || !req.body.otp
        || !req.body.status

    ) {
        res.status(403).send(`
            please send email & otp in json body.
            e.g:
            {
                "email": "malikasinger@gmail.com",
                "clientID": "xxxxxx",
                "otp": "xxxxx" 
            }`)
        return;
    }
    otpModel.find({ email: req.body.email },
        function (err, otpData) {

            if (err) {
                res.status(500).send({
                    message: "an error occured: " + JSON.stringify(err)
                });

            } else if (otpData) {

                otpData = otpData[otpData.length - 1]
                // console.log("otpData: ", otpData);

                const now = new Date().getTime();
                const otpIat = new Date(otpData.createdOn).getTime(); // 2021-01-06T13:08:33.657+0000
                const diff = now - otpIat; // 300000 5 minute

                // console.log("diff: ", diff);

                if (otpData.otpCode === req.body.otp && diff < 300000) { // correct otp code
                    otpData.remove()

                    order.findOne({ ClientId: req.body.ClientId },
                        (err, user) => {
                            if (err) {
                                res.send(err)
                                console.log(err);
                            } else {
                                user.update({ status: req.body.status }, (err, data) => {
                                res.send({
                                    ClientId:user.ClientId,
                                    ClientName:user.ClientName,
                                    ClientEmail:user.email,
                                    Status:"Updated"
                                })
                                })
                            }
                        });

                    console.log("update");

                } else {
                    res.status(401).send({
                        message: "incorrect otp"
                    });
                }
            } else {
                res.status(401).send({
                    message: "incorrect otp"
                });
            }
        })

})



app.get('/', (req, res, next) => {
    order.find({}, (err, data) => {
        if (!err) {

            res.send({
                Data: data,
            });
        }
        else {
            res.status(500).send("error");
        }
    })
})







app.listen(PORT, () => {
    console.log("start server....", `http://localhost:${PORT}`)
});

