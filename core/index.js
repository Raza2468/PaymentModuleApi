
const PORT = process.env.PORT || 5000;
// const ServerSecretKey = process.env.SECRET || "123";
// const POSTSECRET = process.env.POSTSECRET || "1231321";
const dbURI = process.env.dbURI || "mongodb+srv://toys:2468@toyscluster.02awi.mongodb.net/?retryWrites=true&w=majority";

module.exports = {
    PORT: PORT,
    dbURI: dbURI,
    // POSTSECRET : POSTSECRET,
    // ServerSecretKey : ServerSecretKey,
}