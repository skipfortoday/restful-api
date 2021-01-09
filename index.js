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
  let sql = `SELECT DAY(a.TanggalScan) as Hari, MONTH(a.TanggalScan)as Bulan, YEAR(a.TanggalScan) as Tahun,a.UserID, b.Nama, a.ScanMasuk, a.ScanPulang, a.Shift, IF(TIMEDIFF(a.ScanMasuk,a.JamMasuk)< '00:00:00','-',TIMEDIFF(a.ScanMasuk,a.JamMasuk)) as Terlambat, TIMEDIFF(a.ScanPulang,a.JamPulang) as diffLembur, IF(TIMEDIFF(a.ScanPulang,a.JamPulang)< '00:30:00','-',TIMEDIFF(a.ScanPulang,a.JamPulang)) as Lembur FROM ATTLOG a JOIN user b ON a.UserID = b.UserID ORDER BY a.TanggalScan DESC LIMIT 10  `;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Tampilkan 30 Day  Scan Untuk Admins
app.get('/api/attlog/:id',(req, res) => {
  let sql = `SELECT DAYNAME(a.TanggalScan)as NamaHari, DAY(a.TanggalScan) as Hari, MONTH(a.TanggalScan)as Bulan, YEAR(a.TanggalScan) as Tahun,a.UserID, b.Nama, a.ScanMasuk, a.ScanPulang, a.Shift, IF(TIMEDIFF(a.ScanMasuk,a.JamMasuk)< '00:00:00','-',TIMEDIFF(a.ScanMasuk,a.JamMasuk)) as Terlambat,IF(TIMEDIFF(a.ScanPulang,a.JamPulang)< '00:30:00','-',TIMEDIFF(a.ScanPulang,a.JamPulang)) as Lembur FROM ATTLOG a JOIN user b ON a.UserID = b.UserID WHERE a.UserID="`+req.params.id+`" ORDER BY a.TanggalScan ASC LIMIT 31   `;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});



//Post Scan Masuk 
app.post('/api/attlog',(req, res) => {
  let data = {UserID: req.body.UserID, TanggalScan: req.body.TanggalScan, ScanMasuk: req.body.ScanMasuk, Shift: req.body.Shift, JamMasuk: req.body.JamMasuk, JamPulang: req.body.JamPulang };
  let sql = "INSERT INTO attlog SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});


//GET Last DatangID Untuk Pulang Dan Masuk
app.get('/api/datang/:id',(req, res) => {
  let sql = "SELECT DatangID FROM attlog WHERE UserID=`"+req.params.id+"` AND TanggalScan=CURRENT_DATE`";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//PUT Untuk Scan Pulang
app.put('/api/datang/:id',(req, res) => {
  let sql = "UPDATE attlog SET ScanPulang='"+req.body.ScanPulang+"'WHERE DatangID="+req.params.id;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify());
  });
});

//tampilkan semua data User
app.get('/api/user',(req, res) => {
  let sql = `SELECT a.UserID, a.Nama, c.NamaRole, b.NamaCabang, DAY(a.TglMasuk) as Hari, MONTH(a.TglMasuk) as Bulan, YEAR(a.TglMasuk) as Tahun
  FROM user a JOIN cabang b ON a.KodeCabang = b.KodeCabang JOIN Role c ON c.RoleUser = a.RoleUser`;
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
   RoleUser: req.body.RoleUser,IdGroups: req.body.IdGroups, KodeCabang: req.body.KodeCabang};
  let sql = "INSERT INTO user SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Edit data user berdasarkan id
app.put('/api/user/:id',(req, res) => {
  let sql = "UPDATE user SET nama='"+req.body.nama+"', pass='"+req.body.pass+"', RoleUser='"+req.body.RoleUser+"', KodeCabang='"+req.body.KodeCabang+"' WHERE UserID="+req.params.id;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});


////////////////////////////////////////////////////////////


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

//GET TIME & JAM Kerja
app.get('/api/gettime',(req, res) => {
  let sql = `SELECT (CURRENT_TIMESTAMP) as Waktu,jamkerja.* FROM jamkerja`;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});


app.post('/api/test',(req, res) => {
  let data = {id: req.body.id, tempat: req.body.tempat, shift: req.body.shift};
  let sql = "INSERT INTO test SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify(results));
  });
});


//Server listening
app.listen(3000,() =>{
  console.log('Server started on port 3000...');
});