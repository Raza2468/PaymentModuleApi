const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const multer = require("multer");
const morgan = require("morgan");
const postmark = require("postmark");
const app = express();
var authRoutes = require("./auth");

const { ServerSecretKey, PORT } = require("./core/index");
const { payment, otpModel, clientdata, employee } = require("./dbase/modules");
const serviceAccount = require("./firebase/firebase.json");
const client = new postmark.Client("fa2f6eae-eaa6-4389-98f0-002e6fc5b900");
// const client = new postmark.Client("404030c2-1084-4400-bfdb-af97c2d862b3");
// Send an email:
// var client = new postmark.ServerClient("404030c2-1084-4400-bfdb-af97c2d862b3")

// Send an SmS:

var sid = "AC5895e1f24b9309e9d14fa9e47920bf33";
var auth_token = "0fee8c26cde02e811aa49e1cd744ffae";
const twilio = require("twilio")(sid, auth_token);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("short"));

app.use("/auth", authRoutes);

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      `${new Date().getTime()}-${file.filename}.${file.mimetype.split("/")[1]}`
    );
  },
});

const upload = multer({ storage: storage });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://toys-97d91-default-rtdb.firebaseio.com",
});

const bucket = admin.storage().bucket("gs://toys-db4fb.appspot.com");

// Upload Imag Api

app.post("/upload", upload.any(), (req, res, next) => {
  bucket.upload(req.files[0].path, function (err, file, apiResponse) {
    if (!err) {
      file
        .getSignedUrl({
          action: "read",
          expires: "03-09-2491",
        })
        .then((urlData, err) => {
          if (!err) {
            res.status(200).send({
              ImageUrl: urlData[0],
            });
          }
        });
    } else {
      res.status(500).send();
    }
  });
});

// PaymentData Api

app.post("/PaymentData", (req, res, next) => {
  if (!req.body.PaymentId) {
    res.status(409).send(`
                    Please send PaymentName  in json body
                    e.g:
                    "PaymentId":"PaymentId",
                    "PaymentName": "PaymentName",
                    "PaymentEmail": "PaymentEmail"
                `);
    return;
  } else {
    const newPayment = new payment({
      PaymentId: req.body.PaymentId, // user.clientID
      PaymentName: req.body.PaymentName, // user.clientName
      PaymentEmail: req.body.PaymentEmail, // user.clientEmail
      PaymentNumber: req.body.PaymentNumber,
      PaymentAmount: req.body.PaymentAmount,
      PaymentMode: req.body.PaymentMode,
      imageUrl: req.body.imageUrl,
      heldby: req.body.heldby,
      drawOn: req.body.drawOn,
      dueOn: req.body.dueOn,
      status: "false",
    });
    newPayment
      .save()
      .then((data) => {
        // res.send(data)
        const otp = Math.floor(getRandomArbitrary(1111, 9999));
        otpModel
          .create({
            PaymentEmail: req.body.PaymentEmail, // User Email
            otpCode: otp,
          })
          .then((doc) => {
            client.sendEmail({
              From: "faiz_student@sysborg.com",
              To: req.body.PaymentEmail,
              Subject: "Payment verify OTP",
              TextBody: `Here is verify Otp code: ${otp}`,
            });

            twilio.messages.create({
              from: "+12135285920",
              to: `+92${req.body.PaymentNumber}`,
              body: `Here is verify Otp code: ${otp}`,
            });
          })
          .then((status) => {
            console.log("status: ", status);
            res.send({
              data,
              PaymentId: req.body.PaymentId,
              PaymentName: req.body.PaymentName,
              PaymentAmount: req.body.PaymentAmount,
              message: "email sent with otp",
            });
          })
          .catch((err) => {
            console.log("error in creating otp: ", err);
            res.status(500).send("unexpected error ");
          });
      })
      .catch((err) => {
        res.status(500).send({
          message: "an error occured : " + err,
        });
      });
  }
});

// Otp Send Api

//  Rendom 5 number Otp

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// Step 2 Recive Email Otp Api

app.post("/ReciveOtpStep-2", (req, res, next) => {
  if (!req.body.PayObjectId || !req.body.otp || !req.body.status) {
    res.status(403).send(`
            please send email & otp in json body.
            e.g:
            {
                "email": "faizeraza2468@gmail.com",
                "PaymentId": "xxxxxx",
                "otp": "xxxxx" 
            }`);
    return;
  }
  otpModel.find({ PayObjectId: req.body.PayObjectId }, function (err, otpData) {
    if (err) {
      res.status(500).send({
        message: "an error occured: " + JSON.stringify(err),
      });
    } else if (otpData) {
      otpData = otpData[otpData.length - 1];

      const now = new Date().getTime();
      const otpIat = new Date(otpData.createdOn).getTime(); // 2021-01-06T13:08:33.657+0000
      const diff = now - otpIat; // 300000 5 minute

      if (otpData.otpCode === req.body.otp) {
        //&& diff < 300000
        // otpData.remove()

        payment.findOne({ _id: req.body.PayObjectId }, (err, user) => {
          if (err) {
            res.send(err);
          } else {
            user.update({ status: req.body.status }, (err, data) => {
              if (!err) {
                res.send({
                  message: "Stutus update",
                  user,
                  data,
                });
                console.log(user.PaymentEmail);
                client.sendEmail({
                  From: "faiz_student@sysborg.com",
                  To: user.PaymentEmail,
                  Subject: "Thank for Payment has been Recive",
                  TextBody: `payment is successfully recorded in our system.`,
                });
              } else {
                console.log(err);
              }
            });
          }
        });
      } else {
        res.status(401).send({
          message: "incorrect otp",
        });
      }
    } else {
      res.status(401).send({
        message: "incorrect otp",
      });
    }
  });
});

//  ReSend OTP

app.post("/ReSendOTP", (req, res) => {
  if (!req.body.PaymentEmail) {
    res.send("email");
  } else {
    otpModel.find(
      { PaymentEmail: req.body.PaymentEmail },
      function (err, otpData) {
        if (!err) {
          client.sendEmail({
            From: "faiz_student@sysborg.com",
            To: req.body.PaymentEmail,
            Subject: "Resend Payment verify OTP",
            TextBody: `Here is verify Otp code: ${(otpData =
              otpData[otpData.length - 1].otpCode.toString())}`,
          });
          res.send("Please Check the email");
        } else {
          res.send(err);
        }
      }
    );
  }
});

// Post conformationPayment
// app.post("/conformationPayment", (req, res, next) => {
//   if (!req.body.ClientObjectId) {
//     res.send("ClientObjectId");
//   } else {
//     clientdata.findById({ _id: req.body.ClientObjectId }, (err, data) => {
//       if (!err) {
//         client.sendEmail({
//           From: "faiz_student@sysborg.com",
//           To: data.ClientEmail,
//           Subject: "Thank for Payment has been Recive",
//           TextBody: `payment is successfully recorded in our system.`,
//         });
//         res.send(data);
//       } else {
//         res.send(err);
//       }
//     });
//   }
// });
// Get all Data Payment Api

app.get("/", (req, res, next) => {
  payment.find({}, (err, data) => {
    if (!err) {
      res.send({
        Data: data,
      });
    } else {
      res.status(500).send("error");
    }
  });
});

// collectionsby

app.post("/collectionBy", (req, res, next) => {
  let item = {
    name: res.heldby,
    cheque: 0,
    cash: 0,
    count: 0,
    totalAmount: 0,
  };
  payment.find({ heldby: req.body.heldby }, (err, data) => {
    if (!err) {
      //  res.send(data);
      for (var i = 0; i < data.length; i++) {
        item.totalAmount = item.totalAmount + parseInt(data[i].PaymentAmount);
        item.count = data.length;
        if (data[i].PaymentMode == "Cash") {
          item.cash += data[i].PaymentAmount;
        } else if (data[i].PaymentMode == "Cheque") {
          item.cheque += parseInt(data[i].PaymentAmount);
        } else {
          item.others += dparseInt(data[i].PaymentAmount);
        }
        console.log("Item", item);
      }
      res.send(item);
    } else {
      res.status(500).send("error");
    }
  });
});

app.post("/heldBy", (req, res, next) => {
  payment.find({ heldby: req.body.heldby }, (err, data) => {
    if (!err) {
      res.send(data);
    } else {
      res.status(500).send("error");
    }
  });
});

app.post("/CashierSummary", (req, res, next) => {
  let collections = [];
  var cashiers = [];
  employee.find({ Role: "Cashier" }, (err, data) => {
    if (!err) {
      cashiers = data;
      console.log("Cashiers length", cashiers.length);
      let result = test(data);
      res.send(result);
    }
  });
  // function test(cashiers){
  //     console.log("Cashiers lengthin test",cashiers.length);
  //     return"done testing";
  // }
  console.log("Cashiers outside", cashiers);
});

function test(cashiers) {
  console.log("Cashiers length in test", cashiers.length);
  let collections = [];
  for (var i = 0; i < cashiers.length; i++) {
    //    console.log("in cashier loop");
    let payments = [];
    payment.find({ heldby: cashiers[i].employeeName }, (err, data) => {
      // finding all payments held by cashier
      if (!err) {
        payments = data; // stores all  payments of specific cashier
        //  console.log("Payments by casier",cashiers[i].employeeName ,payments.length);
        let item = getsummaryItems(cashiers[i].employeeName, payments);
        collections.push(item);
      } else {
        res.status(500).send("errorin finding payments of a cashier");
      }
    });
    let item = getsummaryItems(cashiers[i].employeeName, payments);
    collections.push(item);
  }
  //  console.log("Collections",collections);
  return collections;
}
//res.send(collections);

//- internal function
function getsummaryItems(name, payments) {
  let item = {
    employeeNamr: name,
    cheques: 0,
    cash: 0,
    count: 0,
    others: 0,
    totalAmount: 0,
  };
  console.log("in Summary Item", name, payments.length);
  for (var i = 0; i < payments.length; i++) {
    item.totalAmount = item.totalAmount + payments[i].PaymentAmount;
    item.count = payments.length;
    if (payments[i].PaymentMode == "Cash") {
      item.cash += payments[i].PaymentAmount;
    } else if (payments[i].PaymentMode == "Cheque") {
      item.cheque += payments[i].PaymentAmount;
    } else {
      item.others += payments[i].PaymentAmount;
    }
  }
  return item;
}

//Post All Api with ClientData

app.post("/ClientData", (req, res, next) => {
  if (!req.body.ClientId || !req.body.ClientName) {
    res.status(409).send(`
                    Please send PaymentName  in json body
                    e.g:
                    "ClientId":"ClientId",
                    "ClientName": "ClientName",
                    "ClientPhoneNumber": "ClientPhoneNumber",
                    "ClientAmount": "ClientAmount"
                    "ClientEmail": "ClientEmail"
                `);
    return;
  } else {
    const newClient = new clientdata({
      ClientId: req.body.ClientId,
      ClientName: req.body.ClientName,
      ClientPhoneNumber: req.body.ClientPhoneNumber,
      ClientAmount: req.body.ClientAmount,
      ClientEmail: req.body.ClientEmail,
      BelongsTo: req.body.BelongsTo,
      ClientRider: "Select Rider",
    });
    newClient
      .save()
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: "an error occured : " + err,
        });
      });
  }
});

//Get All Api with ClientData
app.get("/ClientData", (req, res, next) => {
  clientdata.find({}, (err, data) => {
    if (!err) {
      res.send({
        Data: data,
      });
    } else {
      res.status(500).send("error");
    }
  });
});

app.post("/ClientDataUpdate", (req, res, next) => {
  // console.log(req.body.id);
  // console.log(req.body.ClientRider);

  let updateObj = {};

  if (req.body.ClientRider) {
    updateObj.ClientRider = req.body.ClientRider;
  }
  if (req.body.ClientRiderObjectId) {
    updateObj.ClientRiderObjectId = req.body.ClientRiderObjectId;
  }
  if (req.body.CashierName) {
    updateObj.CashierName = req.body.CashierName;
  }
  clientdata.findByIdAndUpdate(
    req.body.id,
    updateObj,
    { new: true },
    (err, data) => {
      if (!err) {
        res.send({
          data: data,
          message: "Assign Rider Successfully!",
          // status: 200
        });
      } else {
        res.status(500).send("error happened");
      }
    }
  );

  // clientdata.findById({ _id: req.body.id },
  //     (err, data) => {
  //         if (!err) {
  //             data.update({ ClientRider: req.body.ClientRider },
  //                 (err, updatestatus) => {
  //                     if (updatestatus) {
  //                         res.send({
  //                             data: data,
  //                             message: "Assign Rider Successfully!",
  //                             // status: 200
  //                         })

  //                     } else {
  //                         res.send(err, "ERROR")
  //                     }
  //                 })
  //         } else {
  //             res.send({ status: 404 })
  //         }
  //     })
});

app.get("/paymentSummary", (req, res, next) => {
  payment.find({}, (err, data) => {
    if (!err) {
      const unique = (value, index, self) => {
        return self.indexOf(value) === index;
      };
      const uniqueAges = data.filter(unique);

      console.log(uniqueAges);
      //     var a = data.filter((x, i, a) => a.indexOf(x) === i)
      // //   const b =
      res.send(uniqueAges.heldby);
    } else {
      res.status(500).send(err);
    }
  });
});

app.listen(PORT, () => {
  console.log("start server....", `http://localhost:${PORT}`);
});
