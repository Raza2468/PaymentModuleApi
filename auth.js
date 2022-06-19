const express = require("express");
const { employee } = require("./dbase/modules");


var app = express.Router()



app.post('/employe', (req, res, next) => {
    if (!req.body.email || !req.body.password) {

    } else {
        employee.findOne({ email: req.body.email }, (err, doc) => {
            if (!err) {
                var employ = new employee({
                    employeeName: req.body.name,
                    employeeEmail: req.body.email,
                    employeePassword: req.body.password,
                    Role: "Awaiting"
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

app.get('/employe', (req, res, next) => {
    employee.find({ Role: "Cashir" }, (err, data) => {
        if (!err) {
            res.send(data);
        }
        else {
            res.status(500).send("error");
        }
    })
})

app.get('/employe', (req, res, next) => {
    employee.find({ Role: "Rider" }, (err, data) => {
        if (!err) {
            res.send(data);
        }
        else {
            res.status(500).send("error");
        }
    })
})



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
    employee.findOne({ email: req.body.email },
        function (err, doc) {
            if (err) {

                res.status(500).send({ message: "an error accure" })
            } 
            else if (doc) {

                // bcrypt.varifyHash(req.body.password, doc.password).then(result => {
                if (doc) {

                    // console.log("matched");
                    // var token = jwt.sign({
                    //     id: doc._id,
                    //     name: doc.name,
                    //     email: doc.email,
                    //     role: doc.role,
                    // }, ServerSecretKey);

                    // res.cookie('jToken', token, {
                    //     maxAge: 86_400_000,
                    //     httpOnly: true
                    // });

                    res.send({
                        message: "login success",
                     doc
                        // doc: {
                        //     name: doc.name,
                        //     email: doc.email,
                        //     role: doc.role,
                        // },
                        // token: token
                    })
                } 
                else {
                    console.log("not matched");
                    res.status(401).send({
                        message: "incorrect password"
                    })
                }
                // }).catch(e => {
                //     console.log("error: ", e)
                // })
            } else {
                res.status(403).send({
                    message: "user not found"
                });
            }
        })
})


// =======================export
module.exports = app