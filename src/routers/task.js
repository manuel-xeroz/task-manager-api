const express = require('express')
const router = new express.Router();
const auth = require('../middleware/auth')
const Task = require('../models/task');
//GET tasks/?completed=true
//GET tasks/?limit=1&skip=2
//GET tasks/?sortBy=createdAt:desc
router.get('/tasks/me', auth, async (req, res) => {
    const match = {};
    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    const sort = {};
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;  
    }
    try {
        const user = req.user
        await user.populate({
            path: 'myTasks',
            match,
            options : {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(user.myTasks);
    } catch(e) {
        res.status(400).send();
    }

})

router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body);
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    
    try {
        await task.save();
        res.status(201).send(task);
    } catch(e) {
        res.status(400).send(e)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const task = await Task.findOne({ _id , owner: req.user._id });
        if(!task) {
            return res.status(404).send();
        }
        res.send(task)
    } catch(e) {
        res.status(500).send(e);
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description' , 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates' })
    }
    try {
        const _id = req.params.id;
        //const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })
        const task = await Task.findOne({ _id, owner: req.user._id });
        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();  
        res.send(task);
    } catch(e) {
        res.status(500).send(e);
    }
})


router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id});
        await task.save();
        res.send(task);
    } catch(e) {
        res.status(400).send();
    }
})

module.exports = router;