const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const multer = require("multer");
const morgan = require("morgan");
const postmark = require("postmark");
const app = express()



const { ServerSecretKey, PORT } = require("./core/index")
const { payment, otpModel, clientdata } = require('./dbase/modules')
const serviceAccount = require("./firebase/firebase.json");
const client = new postmark.Client("fa2f6eae-eaa6-4389-98f0-002e6fc5b900");




app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(express.json())
app.use(morgan('short'))




const storage = multer.diskStorage({
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


const bucket = admin.storage().bucket("gs://toys-db4fb.appspot.com");





// Upload Imag Api

app.post("/upload", upload.any(), (req, res, next) => {

    bucket.upload(
        req.files[0].path,
        function (err, file, apiResponse) {
            if (!err) {
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                }).then((urlData, err) => {
                    if (!err) {

                        res.status(200).send({
                            ImageUrl: urlData[0],
                        })
                    }
                })
            } else {
                res.status(500).send();
            }
        });
})


// PaymentData Api

app.post("/PaymentData", (req, res, next) => {

    if (!req.body.PaymentId
        || !req.body.PaymentName
        || !req.body.PaymentEmail
    ) {
        res.status(409).send(`
                    Please send PaymentName  in json body
                    e.g:
                    "PaymentId":"PaymentId",
                    "PaymentName": "PaymentName",
                    "PaymentEmail": "PaymentEmail"
                `)
        return;
    } else {

        const newUser = new payment({
            PaymentId: req.body.PaymentId,  // user.clientID 
            PaymentName: req.body.PaymentName,  // user.clientName 
            PaymentEmail: req.body.PaymentEmail,  // user.clientEmail 
            heldby: req.body.heldby,
            dueOn: req.body.dueOn,
            drawOn: req.body.drawOn,
            paymentMode: req.body.paymentMode,
            status: "false"
        })
        newUser.save().then((data) => {
            res.send(data)

        }).catch((err) => {
            res.status(500).send({
                message: "an error occured : " + err,
            })
        });
    }
})


// Otp Send Api

app.post('/PaymentSendOtp', upload.any(), (req, res, next) => {


    if (!req.body.PaymentId) {  //!req.body.imageUrl
        res.status(403).send(`
        please send email in json body.
        e.g:
        {
            "email": "Razamalik468@gmail.com"
        }`)
        return;
    } else {

        payment.findOne({ PaymentId: req.body.PaymentId },
            function (err, user) {
                if (err) {

                    res.status(500).send({
                        message: "an error occured: " + JSON.stringify(err)
                    });
                } else if (user) {
                    // res.send(user)

                    const PaymentDataUpdate = {
                        imageUrl: req.body.imageUrl,
                        PaymentAmount: req.body.PaymentAmount,
                    }

                    user.updateOne(PaymentDataUpdate, (err, doc) => {
                        if (!err) {

                            const otp = Math.floor(getRandomArbitrary(11111, 99999))
                            otpModel.create({
                                PaymentEmail: user.PaymentEmail,  // User Email
                                otpCode: otp
                            }).then((doc) => {
                                client.sendEmail({
                                    "From": "faiz_student@sysborg.com",
                                    "To": user.PaymentEmail,
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
                            res.status(500).send("ImageUrl error: ", err)
                        }
                    })
                } else {
                    res.status(403).send({
                        message: "user not found"
                    });
                }
            })
    }
})


//  Rendom 5 number Otp

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


// Step 2 Recive Email Otp Api

app.post('/ReciveOtpStep-2', (req, res, next) => {


    if (!req.body.PaymentId // order id required 
        || !req.body.otp
        || !req.body.status

    ) {
        res.status(403).send(`
            please send email & otp in json body.
            e.g:
            {
                "email": "malikasinger@gmail.com",
                "PaymentId": "xxxxxx",
                "otp": "xxxxx" 
            }`)
        return;
    }
    otpModel.find({ PaymentEmail: req.body.PaymentEmail },
        function (err, otpData) {

            if (err) {
                res.status(500).send({
                    message: "an error occured: " + JSON.stringify(err)
                });

            } else if (otpData) {

                otpData = otpData[otpData.length - 1]

                const now = new Date().getTime();
                const otpIat = new Date(otpData.createdOn).getTime(); // 2021-01-06T13:08:33.657+0000
                const diff = now - otpIat; // 300000 5 minute


                if (otpData.otpCode === req.body.otp && diff < 300000) {
                    otpData.remove()

                    payment.findOne({ PaymentId: req.body.PaymentId },
                        (err, user) => {
                            if (err) {

                                res.send(err)
                            } else {
                                user.update({ status: req.body.status }, (err, data) => {
                                    if (!err) {
                                        res.send("Stutus update")
                                    } else {
                                        console.log(err);
                                    }
                                })
                            }
                        })
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


// Get all Data Payment Api

app.get('/', (req, res, next) => {
    payment.find({}, (err, data) => {
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



//Post All Api with ClientData 


app.post("/ClientData", (req, res, next) => {

    if (!req.body.ClientId
        || !req.body.ClientName
        || !req.body.ClientPhoneNumber
        || !req.body.ClientAmount
    ) {
        res.status(409).send(`
                    Please send PaymentName  in json body
                    e.g:
                    "ClientId":"ClientId",
                    "ClientName": "ClientName",
                    "ClientPhoneNumber": "ClientPhoneNumber",
                    "ClientAmount": "ClientAmount"
                `)
        return;
    } else {
        const newUser = new clientdata({
            ClientId: req.body.ClientId,
            ClientName: req.body.ClientName,
            ClientPhoneNumber: req.body.ClientPhoneNumber,
            ClientAmount: req.body.ClientAmount,
            status: "false"
        })
        newUser.save().then((data) => {
            res.send(data)

        }).catch((err) => {
            res.status(500).send({
                message: "an error occured : " + err,
            })
        });
    }
})


//Get All Api with ClientData 
app.get('/ClientData', (req, res, next) => {
    clientdata.find({}, (err, data) => {
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

