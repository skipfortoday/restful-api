const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
 
// parse application/json
app.use(bodyParser.json())
app.use(cors())
 
//create database connection
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'absensi'
});
 
//connect to database
conn.connect((err) =>{
  if(err) throw err;
  console.log('Mysql Connected...');
});
 
//Tampilkan 10 Recent Scan Untuk Admin
app.get('/api/attlog',(req, res) => {
  let sql = `SELECT a.TanggalScan, a.UserID, b.Nama, a.ScanMasuk, a.ScanPulang, a.Shift
  FROM ATTLOG a JOIN user b ON a.UserID = b.UserID ORDER BY a.TanggalScan DESC LIMIT 10`;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});
 
//tampilkan data scan berdasarkan id
app.get('/api/attlog/:id',(req, res) => {
  let sql = `SELECT a.TanggalScan, a.UserID, b.Nama, a.ScanMasuk, a.ScanPulang, a.Shift
  FROM ATTLOG a JOIN user b ON a.UserID = b.UserID WHERE a.UserID="`+req.params.id +`
  "ORDER BY a.TanggalScan DESC LIMIT 30`;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});


//Post Scan Masuk 
app.post('/api/attlog',(req, res) => {
  let data = {UserID: req.body.UserID, TanggalScan: req.body.TanggalScan, ScanMasuk: req.body.ScanMasuk, Shift: req.body.Shift };
  let sql = "INSERT INTO attlog SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//tampilkan semua data User
app.get('/api/user',(req, res) => {
  let sql = "SELECT * FROM user";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});


//tampilkan data user berdasarkan id
app.get('/api/user/:id',(req, res) => {
  let sql = "SELECT * FROM user WHERE UserID="+req.params.id;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Tambahkan data user
app.post('/api/user',(req, res) => {
  let data = {UserID: req.body.UserID, Nama: req.body.Nama, Pass: req.body.Pass, TglMasuk: req.body.TglMasuk,
   RoleUser: req.body.RoleUser, KodeCabang: req.body.KodeCabang};
  let sql = "INSERT INTO user SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Edit data user berdasarkan id
app.put('/api/user/:id',(req, res) => {
  let sql = "UPDATE user SET nama='"+req.body.nama+"', pass='"+req.body.pass+"' WHERE pin="+req.params.id;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//tampilkan Kategori Izin
app.get('/api/kategori_izin',(req, res) => {
  let sql = "SELECT * FROM kategori_izin";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//tampilkan Request (view untuk jabatan level 1)
app.get('/api/izin',(req, res) => {
  let sql = `SELECT a.nama, b.tgl_mulai, b.tgl_selesai, c.nama_cabang, d.kategori_izin
  FROM user a JOIN izin b ON a.pin = b.pin
  JOIN cabang c ON c.sn = a.sn
  JOIN kategori_izin d ON d.id_kategori = b.id_kategori
  ORDER BY b.tgl_mulai DESC`;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//tampilkan semua izin yang sudah diterima level 1 (view Untuk jabatan level 2)
app.get('/api/izin/acc1',(req, res) => {
  let sql = "SELECT * FROM izin Where acc_1 is Not Null";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//tampilkan semua izin yang sudah diterima level 2 (view Untuk jabatan Level 3)
app.get('/api/izin/acc2',(req, res) => {
  let sql = "SELECT * FROM izin Where acc_2 is Not Null";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//tampilkan semua izin yang sudah diterima
app.get('/api/izin/final',(req, res) => {
  let sql = "SELECT * FROM izin Where acc_3 is Not Null";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//tampilkan data izin yang sudah diterima berdasakan id
app.get('/api/izin/:id',(req, res) => {
  let sql = "SELECT * FROM izin Where acc_3 is Not Null AND pin="+req.params.id;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//tampilkan semua cabang
app.get('/api/cabang',(req, res) => {
  let sql = "SELECT * FROM cabang";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Tambahkan data user
app.post('/api/test',(req, res) => {
  let data = {id: req.body.id, tempat: req.body.tempat};
  let sql = "INSERT INTO test SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});



//Tambahkan data SN & Cabang
app.post('/api/sn',(req, res) => {
  let data = {sn: req.body.sn, nama_cabang: req.body.nama_cabang};
  let sql = "INSERT INTO cabang SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Server listening
app.listen(3000,() =>{
  console.log('Server started on port 3000...');
});