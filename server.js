const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const multer = require("multer");


const app = express()
const { ServerSecretKey, PORT } = require("./core/index")
const { order, comments, childcomment } = require('./dbase/modules')
const serviceAccount = require("./firebase/firebase.json");



app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors({
    origin: "*",
    credentials: true
}));





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



app.get('/profile', (req, res) => {
    order.find({},
        (err, doc) => {
            if (!err) {
                res.send(doc)
            } else {
                res.send(err)
            }
        })

})


app.listen(PORT, () => {
    console.log("start server....", `http://localhost:${PORT}`)
});

    