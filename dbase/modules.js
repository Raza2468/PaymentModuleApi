
const mongoose = require("mongoose");
const { dbURI } = require("../core/index")

/////////////////////////////////////////////////////////////////////////////////////////////////

// let dbURI = 'mongodb://localhost:27017/abc-database';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });


////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on('connected', function () {//connected
    console.log("Mongoose is connected");
});

mongoose.connection.on('disconnected', function () {//disconnected
    console.log("Mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', function (err) {//any error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
});

process.on('SIGINT', function () {/////this function will run jst before app is closing
    console.log("app is terminating");
    mongoose.connection.close(function () {
        console.log('Mongoose default connection closed');
        process.exit(0);
    });
});
////////////////mongodb connected disconnected events///////////////////////////////////////////////





// otpSchema Start
var otpSchema = new mongoose.Schema({
    "orderId": String,
    "ClientId": String,
    "otpCode": String,
    "createdOn": { "type": Date, "default": Date.now },
});
var otpModel = mongoose.model("otps", otpSchema);

// otpSchema End


//  PaymentSchema Start
var paymentSchema = mongoose.Schema({
    PaymentId: String,
    PaymentName: String,
    PaymentEmail: String,
    PaymentAmount: String,
    imageUrl: String,
    status: String,
    "createdOn": { "type": Date, "default": Date.now }
})

var payment = mongoose.model("payment", paymentSchema);

//  PaymentSchema End



// Client Data Start
var clientSchema = mongoose.Schema({
    ClientId: String,
    ClientName: String,
    ClientPhoneNumber: String,
    ClientAmount: String,
    status: String,
    "createdOn": { "type": Date, "default": Date.now }
})

var clientdata = mongoose.model("client", clientSchema);

// Client Data End

module.exports = {

    otpModel: otpModel,
    payment: payment,
    clientdata: clientdata
}