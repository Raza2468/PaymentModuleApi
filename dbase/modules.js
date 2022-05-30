
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





// =======================export
var otpSchema = new mongoose.Schema({
    "orderId": String,
    "ClientId": String,
    "otpCode": String,
    "createdOn": { "type": Date, "default": Date.now },
});
var otpModel = mongoose.model("otps", otpSchema);

// =======================export

// productname: productname.current.value,
// price: price.current.value,
// stock: stock.current.value,
// description: description.current.value,
// imgUrl: img.current.value,


var picSchema = new mongoose.Schema({
    // name: String,
    email: String,
    profileUrl: String,
    createdOn: { type: Date, 'default': Date.now },
    // activeSince: Date,

});
var profilepic = mongoose.model("pic", picSchema);
// ======================>

var orderSchema = mongoose.Schema({
    ClientId: String,
    ClientName: String,
    email: String,
    Amount: String,
    imageUrl: String,
    orderId: String,
    status: String,
    "createdOn": { "type": Date, "default": Date.now }
})

var order = mongoose.model("order", orderSchema);

// =======================export


module.exports = {
    otpModel: otpModel,
    profilepic: profilepic,
    order: order,
}