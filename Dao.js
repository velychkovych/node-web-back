const MongoClient = require('mongodb').MongoClient
const articlePosted = "posted"
const articleEdited = "edited"

class Dao {

    dbConnection = null

    constructor() {
        this.connect()
    }

    connect = () => {
        this.dbConnection = new Promise((resolve, reject) => {
            const client = new MongoClient('mongodb+srv://root:kyx3cX5HwjDEBHPY@cluster0.cufld.mongodb.net/mydb2?retryWrites=true&w=majority'
                , {useNewUrlParser: true, useUnifiedTopology: true})
            client.connect()
                .then(() => client.db('mydb2'))
                .then(db => resolve(db))
                .catch(reject);
        })
    }


    addUser = record => this.ifConnected(db => db.collection('user').insertOne(record))

    updateUser = (username, fieldToUpdate) => this.ifConnected(db => db.collection('user').updateOne({username},
        {$set: fieldToUpdate}
    ))

    deleteUser = username => this.ifConnected(db => db.collection('user').findOneAndDelete({username}))

    getUserByUsername = username => this.ifConnected(db => db.collection('user').findOne({username: username}))

    getAllUsers = () => this.ifConnected(db => db.collection('user').find({}).toArray())

    addArticle = record => this.ifConnected(db => db.collection('article').insertOne(record))

    getAllArticles = () => this.ifConnected(db => db.collection('article').find({}).toArray())

    getArticleByHeader = header => this.ifConnected(db => db.collection('article').findOne({
        header,
        type: articlePosted
    }))

    deleteByHeaderAndUsername = (header, author) => this.ifConnected(db => db.collection('article').findOneAndDelete({
        header,
        author,
        type: articlePosted
    }))

    getByHeaderAndUsername = (header, author) => this.ifConnected(db => db.collection('article').findOne({
        header,
        author,
        type: articleEdited
    }))

    updateArticleType = (header, author, type) => this.ifConnected(db => db.collection('article').updateOne({
            header,
            author
        },
        {$set: {type}}
    ))

    deleteArticleByHeader = header => this.ifConnected(db => db.collection('article').findOneAndDelete({header}))

    ifConnected = dbAction => this.dbConnection ? this.dbConnection.then(dbAction) : Promise.reject('not connected')

}

module.exports = new Dao()