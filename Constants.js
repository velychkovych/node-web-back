const Constants = {
    userRoles : {
        user: "user",
        admin: "admin"
    },
    jwt: {
        saltRounds: 10,
        secret: "secret"
    },
    articleType: {
        posted: "posted",
        edited: "edited"
    },
    mongo: {
        dbUrl: "mongodb+srv://root:kyx3cX5HwjDEBHPY@cluster0.cufld.mongodb.net/mydb2?retryWrites=true&w=majority",
        dbName: "mydb2",
        collections: {
            user: "user",
            article: "article"
        },
        notConnectedMsg : "not connected"

    }
}

module.exports = Constants