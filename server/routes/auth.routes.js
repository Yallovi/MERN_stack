const Router = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');

const router = new Router();

//Создаем post запрос на url `registarion`
router.post('/registration',
    [
        check('email', "Incorret email").isEmail(),
        check('password', "Password must be longer than 3 and shorter 12").isLength({min:3, max:12}),

    ],
    async (req,res) => {
    
    try {
        console.log(req.body);
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({message: "Incorrect request", errors});
        }
        //получаем email и pass из теда запроса
        const {email, password} = req.body;
        //проверяем существует ли такой пользователь в базе
        const candidate = await User.findOne({email})

        if(candidate) {
            return res.status(400).json({message: `User with email ${email} already exist`});
        }
        // хэшируем пароль
        const hashPassword = await bcrypt.hash(password, 8);

        // если try создаем нового пользователя 
        const user = new User({email, password: hashPassword});

        // сохраняем в бд пользователя 
        await user.save();
        return res.json({message: "User was created"});
    }catch(e){
        console.log(e);
        res.send({message: 'Server error'});
    }
});

router.post('/login',
    async (req,res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        const isPassValid = bcrypt.compareSync(password, user.password);
        if(!isPassValid){
            return res.status(400).json({message: 'Invalid password'});
        }
        const token = jwt.sign({id: user.id}, config.get("secretKey"), {expiresIn: "1h"});
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                diskSpace: user.diskSpace,
                usedSpace: user.usedSpace,
                avater: user.avater,
            }
        })
    }catch(e){
        console.log(e);
        res.send({message: 'Server error'});
    }
});

module.exports = router; 