//===imports===//
const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');
const router = express.Router()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
require('dotenv').config();
router.use(express.json());
//=============//


//cors config
router.use(cors({
    origin: "*",
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Content-Type,Authorization',
}));
//=============//

//credentials
const db_user = process.env.DB_USER
const db_pass = process.env.DB_PASS
//==============//

//Models
const User = require('./models/User');
//==============//

//MONGODB CONECT
mongoose.connect(`mongodb+srv://${db_user}:${db_pass}@cluster0.znoo2gk.mongodb.net/?retryWrites=true&w=majority`)
    .then(() => {
        console.log("BD CONECTADO")
    })
    .catch(error => {
        console.error("DB CONNECTION ERROR:", error);
    });
//===============//


//==============Rotas===============//
router.get('/', (req, res) => {
    res.status(200).json({ status: 'API Online e Funcionando!' });
});
//Rota de serviço de envio de email
router.post("/mailTO", (req, res) => {
    const dados = req.body;
    //NODEMAILER CONFIG
    const transporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    // Configuração do e-mail
    const emailOptions = {
        from: dados.email,
        to: process.env.MAIL_USER,
        subject: `Nova mensagem do cliente ${dados.nome}`,
        text: `${dados.mensagem}`,
    };
    //Enviar email
    transporter.sendMail(emailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Falha no servidor. Tente mais tarde \u{1F914}' });
        } else {
            return res.status(200).json({ success: true, message: 'Mensagem enviada! \u{1F60A}\u2764' });
        }
    });

})

//Rota para carregar os produtos do estoque no Bling
router.get("/api/bling", async (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    const apikey = "f2627d4ecd999b2ee1e339147d56760fd7efb06f107b4332733f96ba183fe98dc4b6ae34";
    const outputType = "json";
    const url = `https://bling.com.br/Api/v2/produtos/${outputType}?apikey=${apikey}&imagem=S`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao chamar a API ' });
    }

})

//Rota de Calculo de frete
router.post('/api/frete', async (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    const options = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZTBlMGYxMDc1MGMyMTM3NzUwMzhlNTBjYjgyMzRjNDAyMmQ2N2M5OWY5YTgxOTJjNmQ2OWRhMzMzNGRjYWFjZWU1NGExNTU1ZmRkYmRkM2MiLCJpYXQiOjE3MDQwNDcyNjMuMzIyNzYxLCJuYmYiOjE3MDQwNDcyNjMuMzIyNzYzLCJleHAiOjE3MzU2Njk2NjMuMzEwMjE1LCJzdWIiOiI5YWZiMzY2Ny1hNTMyLTQ3ODItOWJhYy02MzdhZDQyZWQzMTUiLCJzY29wZXMiOlsic2hpcHBpbmctdHJhY2tpbmciLCJzaGlwcGluZy1jYWxjdWxhdGUiXX0.CBHL_CeSp6Lios8y-Ip_9VdBrOARtJwdmaJlaoCxj-Do_zGGuCUbOkqb7yjGI7QIU4C7N5JBxTgHgBJ3SdZTWukTPE8M0rPNKMNp1eQhJmX1m5-TcpJMqKIqLFJnwxtjqYd_xILNJA_ZobpIBauhO2U1c84nTQADOLCLy_wNJ9RdWsZBB-MmNSsbRaWgFLNusvsnzf0njXDoMR0kJDyrpVAFDIUx_JLGzWvKm9QLKp2qlY1BPxH2nnhCwRCiCI9kcrCb7YpBzm7848Pvxm_BXecJa90dBb_wVazqhcG2IuB5KQfVUO2gkWIENHYMIfU5tcWW_cQFJW24cBoxmWrRDZaQQoXH3Zt2IUVeIsOdps92pbBH28Z4MGJAxDmGIo2wm5MlEZHaMn9n0ibyl3Niq8QZsM1wISh8_hjMKwO0c8ziRwe1z953qX8p1LY_5IG9C2sy1ZuUy1-nLdR0DVSrf4fNddRuJCynaCeaX12JA-RcgQwLALJ2xUo7ivm5sH83j2kKOE0gaxQMumDNw-NqZyJZb4pFrFJ9kO-GnRKRu-UaR8vaN0h7-LQbwvNvKR3VY0LOBDN5Zge2epUAuoFc_4WFm7ko_8F_Gf5kmP9-P2nvGxVQLQmsdIUHZXOHvcH864Bo19etz6vK61IJJX-paiPp-ZHFiOh55c3DbFeaif4',
            'User-Agent': 'Aplicação rodrigorodrigues0990@hotmail.com',
        },
        body: JSON.stringify(req.body),
    };

    try {
        const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', options);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao chamar a API ' });
    }

});

//Rota de cadastro de usuário no banco de dados
router.post('/auth/register', async (req, res) => {
    const { name, email, telefone, senha } = req.body;
    //verifica se o usuário existe
    const userExists = await User.findOne({ email: email })
    if (userExists) {
        return res.status(402).json({ msg: "Esse email ja está cadastrado! \u{1F914}" })
    }
    //============================

    // // //criptografia da senha
    const salt = await bcrypt.genSalt(12);
    const passwordhash = await bcrypt.hash(senha, salt)
    //============================

    //criar usuário
    const user = new User({
        name,
        email,
        telefone,
        password: passwordhash,
    })
    try {
        await user.save()
        res.status(201).json({ msg: "Cadastrado! \u{1F60A}\u2764" })
    } catch (e) {
        console.log(e)
        res.status(500).json({ msg: "Falha no servidor, tente mais tarde! \u{1F914}" })
    }
})

//Rota de consulta a usuário no banco de dados
router.post("/auth/login", async (req, res) => {
    const { email, senha } = req.body;

    //verifica se o usuário existe
    const userExists = await User.findOne({ email: email })
    if (!userExists) {
        return res.status(404).json({ msg: "Email não cadastrado!", status: 404 })
    }
    //============================

    //verifica senha
    const password = await bcrypt.compare(senha, userExists.password)
    if (!password) {
        return res.status(401).json({ msg: "Senha inválida!", status: 401 })
    }
    //Gera token de autenticação
    try {
        const secret = process.env.SECRET
        const token = jwt.sign(
            {
                id: userExists._id
            },
            secret,
        )
        res.status(200).json({ msg: token, status: 200 });
    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: "Falha no servidor, tente mais tarde! \u{1F914} " + err })
    }
})

module.exports = router;