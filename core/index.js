
const PORT = process.env.PORT || 5000;
const dbURI = process.env.dbURI || "mongodb+srv://toys:2468@toyscluster.02awi.mongodb.net/?retryWrites=true&w=majority";

module.exports = {
    PORT: PORT,
    dbURI: dbURI,
}