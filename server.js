const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
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
  user: 'BlockFillerAgent',
  password: 'mysqQFT71$',
  database: 'BlockFiller',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();
module.exports = promisePool;

async function addData(){
    //INSERT INTO table_name (column1, column2) VALUES (value1, value2)
  try {
    const [rows] = await promisePool.query('INSERT INTO BlockFiller (column1, column2) VALUES (value1, value2)');
    console.log(rows);
  } catch (err) {
    console.error('Database query failed:', err);
  }
}

async function deleteAllData(){
    //DELETE FROM table_name
  try {
    const [rows] = await promisePool.query('DELETE FROM table_name');
    console.log(rows);
  } catch (err) {
    console.error('Database query failed:', err);
  }
}

async function getData() {
  try {
    const [rows] = await promisePool.query('SELECT * FROM data');
    console.log(rows);
  } catch (err) {
    console.error('Database query failed:', err);
  }
}

getData();

////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
