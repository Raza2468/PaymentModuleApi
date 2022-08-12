
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
    "PaymentEmail": String,
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
    PaymentNumber: String,
    PaymentAmount: String,
    imageUrl: String,
    PaymentMode: String,
    heldby: String,
    drawOn: String,
    dueOn: String,
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
    ClientEmail: String,
    ClientRider: String,
    ClientRiderObjectId: String,
    CashierName: String,
    BelongsTo: String,
    "createdOn": { "type": Date, "default": Date.now }
})

var clientdata = mongoose.model("client", clientSchema);


var employSchema = mongoose.Schema({
    employeeName: String,
    employeeEmail: String,
    employeePassword: String,
    createdBy: String,
    Role: String,
    "createdOn": { "type": Date, "default": Date.now }
})

var employee = mongoose.model("employe", employSchema);

// Client Data End



var TransactionSchema = mongoose.Schema({
    Nature: String,
    Instrument: Array,
    PaymentAmount: Array,
    BelongsTo: String,
    From: String,   
    to: String,
    "createdOn": { "type": Date, "default": Date.now }
})

var Transaction = mongoose.model('Transaction', TransactionSchema)

module.exports = {

    otpModel: otpModel,
    payment: payment,
    clientdata: clientdata,
    employee: employee,
    Transaction: Transaction
}