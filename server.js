const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config()

const app = express();

app.set('trust proxy', true);

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function respond(message){
  console.log(message);
}

//Tracker

app.post('/track', async (req, res) => {
  try {
    console.log("/Track path trigger no : 1");
    const { name, url, ts } = req.body;
    if (!name || !url || !ts) {
      return res.sendStatus(400);
    }

    const record = {
      event: name,
      url,
      ts,
      ua: req.headers['user-agent'] || '',
      ref: req.headers.referer || null,
      ip: req.ip
    };

    await insertIfNotExists(record);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/track', async (req, res) => {
    respond("the get path triggered");
    res.sendStatus(204);
});

app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from the server', time: Date.now() });
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
  host: 'voxelgenerator.cufce0g48y9x.us-east-1.rds.amazonaws.com',
  user: process.env.username,
  password: process.env.password,
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
    [record.event, record.url, record.ts, record.ua, record.ref, record.ip]
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

app.listen(process.env.PORT || 8080, () => console.log('Server running '));
