const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config()

const username = process.env.username
const password = process.env.password

const app = express();
const PORT = process.env.PORT || 3000;

// Api stuff
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let storedData = { message: "server" };

app.get('/api/data', (req, res) => {
  res.json(storedData);
});

app.post('/api/data', (req, res) => {
  console.log("Received data:", req.body);
  res.json({status : req.body.message})
  
});

app.use(bodyParser.json({limit: '100kb'}));

//Tracker

app.post('/track', async (req, res) => {
  const ua  = req.headers['user-agent'] || '';
  const ref = req.headers['referer']     || req.body.referrer || null;
  const xff = req.headers['x-forwarded-for'];
  let ip = xff ? xff.split(',')[0].trim() : req.socket.remoteAddress;

  if (ip && ip.includes('.')) {
    ip = ip.split('.').slice(0,3).join('.') + '.0'
  }

  const record = {
    event: req.body.name,
    url:   req.body.url,
    ts:    req.body.ts,
    ua,
    ref,
    ip
  };

  await insertIfNotExists(record)
  await getData()

  res.status(204).end();
});

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// DATABASE DEMARKATION LINE

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

///path is var/lib/mysql/BlockFiller/data.ibd

// To access database manually : 
  //mysql -u <username> -p <database_name>

const pool = mysql.createPool({
  host: 'localhost',
  user: username,
  password: password,
  database: 'BlockFiller',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();
module.exports = promisePool;

//INSERT INTO table_name (column1, column2) VALUES (value1, value2);
//DELETE FROM table_name;
//SHOW TABLES;
//USE database_name;
//CREATE TABLE <name>(<key variable> <type, usually int for this>, ... etc);
//DROP TABLE <name>;

async function insertIfNotExists(record) {
  const [result] = await promisePool.query(
    `INSERT IGNORE INTO events (event, url, ts, ua, ref, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [record.event, record.url, 0, record.ua, record.ref, record.ip]
  );
  // If affectedRows === 1 -> inserted. If 0 -> duplicate hit the unique key.
  return result.affectedRows === 1;
}

async function getData() {
  try {
    const [rows] = await promisePool.query('SELECT * FROM events');
    console.log(rows);
  } catch (err) {
    console.error('Database query failed:', err);
  }
}

async function deleteAll() {
  try {
    const [rows] = await promisePool.query('DELETE FROM events');
  } catch (err) {
    console.error('Database query failed:', err);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
