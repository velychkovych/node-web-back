const express = require('express')
const router = express.Router()
const cors = require('cors')

const Dao = require('./Dao')
const Constants = require('./Constants')

const {expressjwt: jwt} = require("express-jwt");
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')

const saltRounds = Constants.jwt.saltRounds
const secret = Constants.jwt.secret

const userRole = Constants.userRoles.user
const adminRole = Constants.userRoles.admin

const articlePosted = Constants.articleType.posted
const articleEdited = Constants.articleType.edited

const app = express()


app.use(express.json())
app.use(cors())

router.post('/signup', (req, res) => {
    const user = {
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, saltRounds),
        role: userRole
    }
    Dao.getUserByUsername(user.username).then(maybeUser => {
        if (!maybeUser) {
            Dao.addUser(user)
                .then(_ => res.sendStatus(200))
                .catch(err => console.error(err))
        } else {
            res.status(403).send('Username already taken')
        }
    })
})

router.get('/user',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        Dao.getUserByUsername(req.query.username)
            .then(user => {
                if (!user) {
                    res.status(404).send('User not found')
                } else {
                    res.status(200).send({
                        username: user.username,
                        role: user.role
                    })
                }
            })
            .catch(err => console.error(err))
    }
)

router.get('/users',
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

router.put('/user',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        if (req.query.username === '') {
            res.status(400).send('query param username is needed')
        } else {
            Dao.getUserByUsername(req.query.username).then(user => {
                if (!user) {
                    res.status(404).send('user not found')
                } else {
                    Dao.updateUser(req.query.username, {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        password: bcrypt.hashSync(req.body.password,saltRounds)
                    })
                        .then(_ => res.sendStatus(200))
                        .catch(err => console.error(err))
                }
            })
        }
    }
)

router.delete('/user',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        if (req.query.username === '') {
            res.status(400).send('query param username is needed')
        } else {
            Dao.getUserByUsername(req.query.username).then(user => {
                if (!user) {
                    res.status(404).send('user not found')
                } else {
                    Dao.deleteUser(req.query.username)
                        .then(_ => res.sendStatus(200))
                        .catch(err => console.error(err))
                }
            })
        }
    }
)

router.post('/user',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        if (req.auth.role === adminRole) {
            const user = {
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, saltRounds),
                role: req.body.role
            }
            Dao.addUser(user)
                .then(_ => res.sendStatus(200))
        } else {
            res.status(403).send('user is not admin')
        }
    })

router.post('/login', (req, res) => {
    Dao.getUserByUsername(req.body.username)
        .then(user => {
                if (!user) {
                    res.sendStatus(404)
                } else if (bcrypt.compareSync(req.body.password, user.password)) {
                    res.status(200).send({
                        jwt: jsonwebtoken.sign({username: user.username, role: user.role}, secret),
                        user: user
                    })
                } else {
                    res.status(401).send('Username or password incorrect')
                }
            }
        ).catch(err => console.error(err))
})

router.post('/article',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        if (req.body.body.length > 2000) {
            res.status(400).send('Article body is too long')
        }
        const article = {
            header: req.body.header,
            body: req.body.body,
            author: req.auth.username,
            type: articlePosted
        }
        Dao.getPostedArticleByHeader(req.body.header).then(maybeArticle => {
            if (maybeArticle) {
                res.status(403).send('Article already exists')
            } else {
                Dao.addArticle(article)
                    .then(_ => res.sendStatus(200))
                    .catch(err => console.error(err))
            }
        })
    })

router.get('/articles',
    (req, res) => {
        Dao.getAllArticles()
            .then(articles => res.status(200).send(articles))
            .catch(err => console.error(err))
    })

router.delete('/article',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        if (req.query.header === '') {
            res.status(400).send('Header query param should be present')
        } else {
            Dao.deleteArticleByHeader(req.query.header)
                .then(_ => res.sendStatus(200))
                .catch(err => console.error(err))
        }
    })

router.put('/article',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        Dao.getPostedArticleByHeader(req.body.header)
            .then(article => {
                if (article) {
                    Dao.addArticle({
                        header: article.header,
                        body: req.body.body,
                        author: req.auth.username,
                        type: articleEdited
                    }).then(_ => res.sendStatus(200))
                        .catch(err => console.error(err))
                } else {
                    res.status(404).send('article not found')
                }
            })
    })

router.post('/article/approve',
    jwt({secret: secret, algorithms: ["HS256"]}),
    (req, res) => {
        if (req.auth.role === adminRole) {
            if (req.query.header === '' || req.query.username === '') {
                res.status(400).send('header and username query param should be present')
            } else {
                Dao.deleteByHeaderAndUsername(req.query.header, req.query.username)
                    .then(_ => Dao.updateArticleType(req.query.header, req.query.username, articlePosted)
                        .then(_ => res.sendStatus(200))
                        .catch(err => console.error(err))
                    )
            }
        } else {
            res.status(403).send('User is not admin')
        }
    }
)

app.use('/api/v1', router)

app.listen(8000, () => console.log("Start..."))