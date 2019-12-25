const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const User = require('../models/user');
const sharp = require('sharp');
const { sendWelcomeMail, sendCancellationMail } = require('../emails/account');
const multer = require('multer');
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('please upload a picture'))
        }

        cb(undefined, true);
    }
    
})

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        sendWelcomeMail(user.email, user.name);
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch(e) {
        res.status(400).send(e)
    }
})

router.get('/users/me', auth, async (req, res) => {
        res.send(req.user);
})

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).send();
        }
        res.send(user)
    } catch(e) {
        res.status(500).send(e);
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        res.status(400).send({ error: 'Invalid updates'})
    }

    try {
        //const _id = req.params.id;
        //const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
        //const user = await User.findById(req.user._id);
        updates.forEach((update) => req.user[update] = req.body[update]) 
        await req.user.save();

        if (!user) {
            return res.status(404).send();
        }
        res.send(req.user)
     } catch(e) {
        res.status(400).send(e);
     }
})

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch(e) {
        res.status(400).send('Unable to login');
    }
    
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
        await req.user.save();
        res.send();
    } catch(e) {
        res.status(400).send();
    }
})

router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch(e) {
        res.status(500).send();
    }
})


router.delete('/users/me', auth, async (req, res) => {
    try {
        sendCancellationMail(req.user.email, req.user.name);
        await req.user.remove();
        res.send(req.user);
    } catch(e) {
        res.status(400).send(e);
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ height: 250, width: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send(req.user);
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar)
    } catch (error) {
        res.status(400).send();
    }
    
})

module.exports = router;