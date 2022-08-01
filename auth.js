const express = require("express");
const { employee, payment, Trasation } = require("./dbase/modules");


var app = express.Router()

// login

app.post('/login', (req, res, next) => {
    if (!req.body.email || !req.body.password) {
        res.status(403).send(
            `please send email and passwod in json body.
            e.g:
             {
            "email": "Razamalik@gmail.com",
            "password": "abc",
         }`)
        return;
    }
    employee.findOne({ employeeEmail: req.body.email },
        function (err, doc) {
            console.log(doc)
            if (!err) {
                if (req.body.password === doc.employeePassword) {

                    res.send(doc);
                }

            } else {
                res.status(403).send({
                    message: "Empolyee not found"
                });
            }
        })
})

// Create Empolyee

app.post('/employe', (req, res, next) => {
    if (!req.body.email || !req.body.password) {

    } else {
        employee.findOne({ email: req.body.email }, (err, doc) => {
            if (!err) {
                var employ = new employee({
                    employeeName: req.body.name,
                    employeeEmail: req.body.email,
                    employeePassword: req.body.password,
                    Role: req.body.Role
                })
                employ.save((err, doc) => {
                    if (!err) {
                        res.send({ message: "Employee created" })
                    } else {
                        res.status(500).send("user create error, " + err)
                    }
                })
            } else {
                res.status(409).send({
                    message: "employee alredy access"
                })
            }
        }

        )
    }
})

// Super Admin 
app.get('/employe', (req, res, next) => {
    employee.find({ Role: "Awaiting" }, (err, data) => {
        if (!err) {
            res.send(data);
        }
        else {
            res.status(500).send("error");
        }
    })
})

//Post Admin 

app.post('/AdminEmploye', (req, res, next) => {
    employee.findById({ _id: req.body.id },
        (err, data) => {
            if (data) {

                data.updateOne({ Role: req.body.Role, Role: "Admin" },
                    (err, updatestatus) => {
                        if (updatestatus) {
                            res.send({ message: "Admin created Successfully!" })

                        } else {
                            res.send(err, "ERROR")
                        }
                    })
            } else {
                res.status(409).send({
                    message: "employee Not Find"
                })
            }
        })
})

// Get Admin

app.get('/AdminEmploye', (req, res, next) => {
    employee.find({ Role: "Admin" }, (err, data) => {
        if (!err) {
            res.send(data);
        }
        else {
            res.status(500).send("error");
        }
    })
})

// Post  Cashier
app.post('/CashierEmploye', (req, res, next) => {
    employee.findById({ _id: req.body.id },
        (err, data) => {
            if (data) {

                data.updateOne({ Role: req.body.Role, Role: "Cashier" },
                    (err, updatestatus) => {
                        if (updatestatus) {
                            res.send({ message: "Admin created Successfully!" })

                        } else {
                            res.send(err, "ERROR")
                        }
                    })
            } else {
                res.status(409).send({
                    message: "employee Not Find"
                })
            }
        })
})

// Get Cashier

app.get('/CashierEmploye', (req, res, next) => {
    employee.find({ Role: "Cashier" }, (err, data) => {
        if (!err) {
            res.send(data);
        }
        else {
            res.status(500).send("error");
        }
    })
})

// Post Rider

app.post('/RiderEmploye', (req, res, next) => {
    employee.findById({ _id: req.body.id },
        (err, data) => {
            if (data) {

                data.updateOne({ Role: req.body.Role, Role: "Rider" },
                    (err, updatestatus) => {
                        if (updatestatus) {
                            res.send({ message: "Admin created Successfully!" })

                        } else {
                            res.send(err, "ERROR")
                        }
                    })
            } else {
                res.status(409).send({
                    message: "employee Not Find"
                })
            }
        })
})

//  get Rider

app.get('/RiderEmploye', (req, res, next) => {
    employee.find({ Role: "Rider" }, (err, data) => {
        if (!err) {
            res.send(data);
        }
        else {
            res.status(500).send("error");
        }
    })
})

app.post('/paymenTrasfer/:id', (req, res, next) => {

    // console.log(req.params.id, "dd");
    // console.log(req.body.id,"dddddddd");

    payment.findById(req.params.id, (err, data) => {
        if (!err) {

            data.updateOne({ heldby: req.body.heldby },

                (UpdateData, UpdateError) => {
                    if (UpdateData) {
                        res.send({
                            message: "Payment Trasfare has been successfully!",
                            data,
                            UpdateData,
                            status: 200
                        })

                    } else {
                        res.send(UpdateError)
                    }
                })
        } else {
            res.status(409).send({
                message: "PaymenTrasfer Error",
                err
            })
        }
    })
})

app.post('/trasation', (req, res, next) => {
    if (!req.body.nature) {
        res.status(409).send(`
        Please send nature in json body
        e.g:
        "nature":"Recive && Transfer",
    `)
    } else {
        const newtrasation = new Trasation({
            Nature: req.body.nature,
            Instrument: req.body.Instrument,
            PaymentAmount: req.body.PaymentAmount,
            From: req.body.From,
            to: req.body.to,
        })
        newtrasation.save().then((data) => {
            res.send(data)

        }).catch((err) => {
            res.status(500).send({
                message: "an error occured : " + err,
            })
        });
    }
})

app.get('/trasation', (req, res, next) => {
    Trasation.find({}, (err, data) => {
        if (!err) {

            res.send(data);
        }
        else {
            res.status(500).send("error");
        }
    })
})

// =======================export
module.exports = app