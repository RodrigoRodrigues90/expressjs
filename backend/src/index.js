const express = require('express');
const app = express();
const router = require('./router');
app.use(express.json());
app.use(router);
app.listen(3333, ()=> console.log("Listening on port 3333"))

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

module.exports = app