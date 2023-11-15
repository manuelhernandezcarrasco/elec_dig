const express = require('express');
const cors = require('cors');
const { exec } = require("child_process");
const { PrismaClient } = require('@prisma/client');
const broker = process.env.BROKER_SERVER
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
const db = new PrismaClient();

const getMessage = (channel, message) => {
  return `mosquitto_pub -h ${broker} -t golf/${channel} -m ${message}`;
}

const createInitialStock = async() => {
  if((await db.stock.findMany()).length === 0) {
    await db.stock.create({data:{stock:0}})
  }
}

app.post('/order', async(req, res) => {
  if(!req.body | isNaN(req.body.amount)) return res.status(400).send('Invalid body')
  const amount = req.body.amount;

  const stock = await db.stock.findFirst();

  if(stock.stock<amount) res.status(400).send('Not enough balls')

  const message = getMessage('ventas', amount)
  console.log("exec command:" + message);
  exec(message, { shell: '/bin/bash' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
    }
  });

  await db.sell.create({data: {amount: amount}})
  await db.stock.update({where:{id: stock.id},data:{stock: (stock.stock-amount)}})

  return res.status(200).send();
});

app.get('/stock', async(req, res) => {
  const stock = await db.stock.findFirst();
  return res.status(200).send({stock:stock.stock});
});

app.post('/stock', async(req, res) => {
  if(!req.body | isNaN(req.body.amount)) return res.status(400).send('Invalid body')
  const amount = req.body.amount;

  let stock = await db.stock.findFirst();
  stock = await db.stock.update({
    where: {
      id: stock.id,
    },
    data: {
      stock: (stock.stock+amount)
    }
  })

  const message = getMessage('stock', stock.stock)
  console.log("exec command:" + message);
  exec(message, { shell: '/bin/bash' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
    }
  });

  return res.status(200).send();
});

app.get('/sells', async(req, res) => {
  const sells = await db.sell.findMany();
  return res.status(200).send(sells);
});

createInitialStock()

const port = process.env.PORT
app.listen(port, () => console.log('Example app is listening on port ' + port ));