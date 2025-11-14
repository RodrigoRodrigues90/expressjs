//===imports===//
const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');
const router = express.Router()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const getFirstName = require("./splitname")
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
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
mongoose.connect(`mongodb+srv://${db_user}:${db_pass}@cluster0.prqqt2c.mongodb.net/madro_db?appName=Cluster0`)
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

    const apikey = process.env.API_KEY_BLING;
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

const requestBodyFrenet = {

    "ShippingServiceCode": null,
    "SellerCEP": "88052-600",
    "RecipientCEP": req.body.to.postal_code,
    "ShipmentInvoiceValue": 29.90,
    "ShippingItemArray": [
        {
            "Weight": req.body.products[0].weight, 
            "Length": req.body.products[0].length,
            "Height": req.body.products[0].height,
            "Width": req.body.products[0].width,
            "Quantity": req.body.products[0].quantity
        }
    ]
};

const tokenFrenet = process.env.TOKEN_FRETE;
const optionsFrenet = {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Token': tokenFrenet, 
    },
    body: JSON.stringify(requestBodyFrenet)
};

try {
    const response = await fetch('https://api.frenet.com.br/shipping/quote', optionsFrenet);    
    const data = await response.json();
    res.json(data);

} catch (error) {
    console.log(error)
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
        const name = getFirstName(userExists.name)
        res.status(200).json({ msg: name, status: 200, token: token });
    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: "Falha no servidor, tente mais tarde! \u{1F914} " + err })
    }
})

module.exports = router;