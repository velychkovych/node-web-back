const MongoClient = require('mongodb').MongoClient
const Constants = require('./Constants')
const articlePosted = Constants.articleType.posted
const articleEdited = Constants.articleType.edited

class Dao {

    dbConnection = null

    constructor() {
        this.connect()
    }

    connect = () => {
        this.dbConnection = new Promise((resolve, reject) => {
            const client = new MongoClient(Constants.mongo.dbUrl
                , {useNewUrlParser: true, useUnifiedTopology: true})
            client.connect()
                .then(() => client.db(Constants.mongo.dbName))
                .then(db => resolve(db))
                .catch(reject);
        })
    }

    addUser = record => this.ifConnected(db => db.collection(Constants.mongo.collections.user).insertOne(record))

    updateUser = (username, fieldToUpdate) => this.ifConnected(db => db.collection(Constants.mongo.collections.user).updateOne({username},
        {$set: fieldToUpdate}
    ))

    deleteUser = username => this.ifConnected(db => db.collection(Constants.mongo.collections.user).findOneAndDelete({username}))

    getUserByUsername = username => this.ifConnected(db => db.collection(Constants.mongo.collections.user).findOne({username: username}))

    getAllUsers = () => this.ifConnected(db => db.collection(Constants.mongo.collections.user).find({}).toArray())

    addArticle = record => this.ifConnected(db => db.collection(Constants.mongo.collections.article).insertOne(record))

    getAllArticles = () => this.ifConnected(db => db.collection(Constants.mongo.collections.article).find({}).toArray())

    getPostedArticleByHeader = header => this.ifConnected(db => db.collection(Constants.mongo.collections.article).findOne({
        header,
        type: articlePosted
    }))

    deleteByHeaderAndUsername = (header, author) => this.ifConnected(db => db.collection(Constants.mongo.collections.article).findOneAndDelete({
        header,
        author,
        type: articlePosted
    }))

    getEditedArticleByHeaderAndUsername = (header, author) => this.ifConnected(db => db.collection(Constants.mongo.collections.article).findOne({
        header,
        author,
        type: articleEdited
    }))

    updateArticleType = (header, author, type) => this.ifConnected(db => db.collection(Constants.mongo.collections.article).updateOne({
            header,
            author
        },
        {$set: {type}}
    ))

    deleteArticleByHeader = header => this.ifConnected(db => db.collection(Constants.mongo.collections.article).findOneAndDelete({header}))

    ifConnected = dbAction => this.dbConnection ? this.dbConnection.then(dbAction) : Promise.reject(Constants.mongo.notConnectedMsg)

}

module.exports = new Dao()