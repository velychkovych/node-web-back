const express = require('express')
const Dao = require('./Dao')
const {expressjwt: jwt} = require("express-jwt");
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')

const saltRounds = 10
const secret = "secret"

const userRole = "user"
const adminRole = "admin"

const articlePosted = "posted"
const articleEdited = "edited"

const app = express()

app.use(express.json())

app.post('/signup', (req, res) => {
    const user = {
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, saltRounds),
        role: userRole
    }
    Dao.addUser(user)
        .then(_ => res.sendStatus(200))
        .catch(err => console.error(err))
})

app.get('/user',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        Dao.getUserByUsername(req.query.username)
            .then(user => res.status(200).send({
                username: user.username,
                role: user.role
            }))
            .catch(err => console.error(err))
    }
)

app.get('/users',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        Dao.getAllUsers()
            .then(users => res.status(200).send(users.map(user => {
                return {
                    username: user.username,
                    role: user.role
                }
            })))
            .catch(err => console.error(err))
    }
)

app.put('/user',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        Dao.updateUser(req.query.username, {
            firstName: req.body.firstName,
            lastName: req.body.lastName
        })
            .then(_ => res.sendStatus(200))
            .catch(err => console.error(err))
    }
)

app.delete('/user',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        Dao.deleteUser(req.query.username)
            .then(_ => res.sendStatus(200))
            .catch(err => console.error(err))
    }
)

app.post('/user',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        if (req.auth.role === adminRole) {
            const user = {
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, saltRounds),
                role: userRole
            }
            Dao.addUser(user)
                .then(_ => res.sendStatus(200))
        } else {
            res.sendStatus(403)
        }
    })

app.post('/login', (req, res) => {
    Dao.getUserByUsername(req.body.username)
        .then(user => {
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    res.status(200).send({
                        jwt: jsonwebtoken.sign({username: user.username, role: user.role}, secret),
                        user: user
                    })
                } else {
                    res.sendStatus(401)
                }
            }
        ).catch(err => console.error(err))
})

app.post('/article',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        if (req.body.body.length > 2000) {
            return res.sendStatus(400)
        }
        const article = {
            header: req.body.header,
            body: req.body.body,
            author: req.auth.username,
            type: articlePosted
        }
        Dao.addArticle(article)
            .then(_ => res.sendStatus(200))
            .catch(err => console.error(err))
    })

app.get('/articles',
    (req, res) => {
        Dao.getAllArticles()
            .then(articles => res.status(200).send(articles))
            .catch(err => console.error(err))
    })

app.delete('/article',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        Dao.deleteArticleByHeader(req.query.header)
            .then(_ => res.sendStatus(200))
            .catch(err => console.error(err))
    })

app.put('/article',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        Dao.getArticleByHeader(req.body.header)
            .then(article => Dao.addArticle({
                header: article.header,
                body: req.body.body,
                author: req.auth.username,
                type: articleEdited
            }))
            .then(_ => res.sendStatus(200))
            .catch(err => console.error(err))
    })

app.post('/article/approve',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        if (req.auth.role === adminRole) {
            Dao.deleteByHeaderAndUsername(req.query.header, req.query.username)
                .then(_ => Dao.updateArticleType(req.query.header, req.query.username, articlePosted)
                    .then(_ => res.sendStatus(200))
                    .catch(err => console.error(err))
                )
        } else {
            res.sendStatus(403)
        }
    }
)

app.listen(3000, () => console.log("Start..."))