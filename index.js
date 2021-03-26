const express = require("express");
const moment = require("moment");
const multer = require("multer");
let cors = require("cors");
let md5 = require("md5");
const bodyParser = require("body-parser");
const app = express();
const mysql = require("mysql");
const { request } = require("express");
let session = require("express-session");


// Disk Upload File
const path = require("path");
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "/uploads"));
  },
  // konfigurasi penamaan file yang unik
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});




// parse application/json
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

//create database connection
const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "absensi",
  timezone: "utc",
});

//connect to database
conn.connect((err) => {
  if (err) throw err;
  console.log("Mysql Connected...");
});

////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        API BERHUBUNGAN DENGAN DATA SCAN         ///////////////////

///////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////
/////////////////////          USERR SIDE              /////////////////////
///////////////////////////////////////////////////////////////////////////

//Tampilkan 5 Recent Scan Untuk User per ID
app.get("/api/lastscan/:id", (req, res) => {
  let sql =
    `SELECT DAYNAME(a.TanggalScan)as NamaHari, DAY(a.TanggalScan) as Hari, MONTH(a.TanggalScan)as Bulan, YEAR(a.TanggalScan) as Tahun, b.Nama, a.ScanMasuk, a.ScanPulang, a.Shift FROM attlog a JOIN user b ON a.UserID = b.UserID WHERE a.UserID="` +
    req.params.id +
    `" ORDER BY a.TanggalScan DESC LIMIT 5`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Tampilkan 5 Recent Scan Untuk User per ID
app.get("/api/lastscan/:id", (req, res) => {
  let sql =
    `SELECT DAYNAME(a.TanggalScan)as NamaHari, DAY(a.TanggalScan) as Hari, MONTH(a.TanggalScan)as Bulan, YEAR(a.TanggalScan) as Tahun, b.Nama, a.ScanMasuk, a.ScanPulang, a.Shift FROM attlog a JOIN user b ON a.UserID = b.UserID WHERE a.UserID="` +
    req.params.id +
    `" ORDER BY a.TanggalScan DESC LIMIT 5`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

////////////////////////////////////////////////////////////////////////////
/////////////////////          ADMIN SIDE              /////////////////////
///////////////////////////////////////////////////////////////////////////

//Tampilkan 10 Recent Scan Untuk Admin

//Tampilkan 30 Day  Scan Untuk Admins dan User
app.get("/api/attlog/:id", (req, res) => {
  let sql =
    `SELECT DAYNAME(a.TanggalScan)as NamaHari, DAY(a.TanggalScan) as Hari, MONTH(a.TanggalScan)as Bulan, YEAR(a.TanggalScan) as Tahun,a.UserID, b.Nama, a.ScanMasuk, a.ScanPulang, a.Shift, IF(TIMEDIFF(a.ScanMasuk,a.JamMasuk)< '00:00:00','-',TIMEDIFF(a.ScanMasuk,a.JamMasuk)) as Terlambat,IF(TIMEDIFF(a.ScanPulang,a.JamPulang)< '00:30:00','-',TIMEDIFF(a.ScanPulang,a.JamPulang)) as Lembur FROM ATTLOG a JOIN user b ON a.UserID = b.UserID WHERE a.UserID="` +
    req.params.id +
    `" ORDER BY a.TanggalScan ASC LIMIT 31   `;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Tampilkan Data Scan Berdasarkan ID Karyawan Dan Menentukan Tanggal Mulai Dan Tanggal Akhir

app.get("/api/tlog/:id&:tglin&:tglout", (req, res) => {
  let sql =
    `SELECT DAYNAME(c.Tanggal)as NamaHari, DAY(c.Tanggal) as Hari, MONTH(c.Tanggal)as Bulan, YEAR(c.Tanggal) as Tahun,
  IFNULL((SELECT a.UserID FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as USERID,
  IFNULL((SELECT b.Nama FROM attlog a, user b WHERE c.Tanggal = a.TanggalScan AND a.UserID = b.UserID AND a.UserID="` +
    req.params.id +
    `" ),"TIDAK MASUK") as Nama,
  IFNULL((SELECT a.ScanMasuk FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as ScanMasuk,
  IFNULL((SELECT a.ScanPulang FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as ScanPulang,
  IFNULL((SELECT a.Shift FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as Shift,
  IFNULL((SELECT IF(TIMEDIFF(a.ScanMasuk,a.JamMasuk)< '00:00:00','-',TIMEDIFF(a.ScanMasuk,a.JamMasuk)) FROM attlog a
   WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as Terlambat,
  IFNULL((SELECT IF(TIMEDIFF(a.ScanPulang,a.JamPulang)< '00:30:00','-',TIMEDIFF(a.ScanPulang,a.JamPulang)) FROM attlog a
   WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as Lembur
  FROM tgl c WHERE c.tanggal between "` +
    req.params.tglin +
    `" and "` +
    req.params.tglout +
    `" ORDER BY c.Tanggal ASC LIMIT 31`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Post Untuk input prosesi absensi dari APP
app.post("/api/attlogUpdate", (req, res) => {
  let post = {
    Pass: req.body.Pass,
    UserID: req.body.UserID,
  };
  let query = "Select * FROM ?? WHERE ??=? AND ??=?";
  let table = ["user", "Pass", post.Pass, "UserID", post.UserID];

  query = mysql.format(query, table);
  conn.query(query, function (error, rows) {
    let grup = rows[0].GroupID;
    let kodecabang = rows[0].KodeCabang;
    console.log(grup);
    console.log(kodecabang);
    if (error) {
      console.log(error);
    } else {
      if (rows.length == 1) {
        res.json({
          Error: true,
          Message: "OK",
          GroupID: grup,
          KodeCabang: kodecabang,
        });
      } else {
        res.json({
          Error: true,
          Message: "UserID atau Pass salah!",
        });
      }
    }
  });
});

//Post Untuk input prosesi absensi dari APP
app.post("/api/attlog", (req, res) => {
  let sql = 
    `CALL ProsesMasuk (
'` +
    req.body.UserID +
    `',
'` +
    req.body.TanggalScan +
    `',
'` +
    req.body.ScanMasuk +
    `',
'` +
    req.body.Shift +
    `',
'` +
    req.body.KodeCabang +
    `'  
)`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Post Untuk input prosesi absensi manual
app.post("/api/attlogmanual", (req, res) => {
  let parsing = { Tanggal: moment.parseZone(moment()).format('YYYY-MM-DD'),
                ScanMasuk: moment.parseZone(moment()).format('HH:mm:ss'),
                UserID: req.body.UserID,
                Nama: req.body.NamaUser}
  let sql =
    `CALL ProsesMasukManual (
'` +
    req.body.UserID +
    `',
'` +
    parsing.Tanggal +
    `',
'` +
    parsing.ScanMasuk +
    `',
'` +
    req.body.Shift +
    `',
'` +
    req.body.Keterangan +
    `'  
)`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(parsing));
  });
});


//Post Untuk input prosesi absensi dari APP
app.put("/api/keterangan/:id", (req, res) => {
  let sql =
    `CALL InputKetTerlambat (
    '` +
    req.params.id +
    `',
    '` +
    req.body.Keterangan +
    `'
    )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify());
  });
});

//GET Data DatangID untuk karyawan yang sama dihari yang sama
// untuk prosesi validasi scan pulang karyawan

app.get("/api/datang/:id", (req, res) => {
  conn.query(
    `CALL MengambilDatangID ('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let datang = rows[0];
      res.send(datang);
    }
  );
});

//Put data untuk update scan pulang setelah mendapatkan DatangID

app.put("/api/datang/:id", (req, res) => {

  let sql =
    `CALL ProsesPulang (
    '` +
    req.params.id +
    `',
    '` +
    req.body.ScanPulang +
    `',
    '` +
    req.body.KetPulang +
    `'
    )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify());
  });
});

app.put("/api/datangmanual/:id", (req, res) => {
  let parsing = {   ScanPulang: moment.parseZone(moment()).format('HH:mm:ss'),
  UserID: req.body.UserID,
  Nama: req.body.NamaUser}
  let sql =
    `CALL ProsesPulang (
    '` +
    req.params.id +
    `',
    '` +
    parsing.ScanPulang+
    `',
    '` +
    req.body.KetPulang +
    `'
    )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(parsing));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////

/////////////       API BERHUBUNGAN DENGAN DATA KELUAR MASUK KANTOR        /////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//Post Untuk input Keluar Kantor
app.post("/api/keluarkantor", (req, res) => {
  let sql =
    `CALL ProsesKeluarKantor (
  '` +
    req.body.DatangID +
    `',
  '` +
    req.body.JamKeluar +
    `',
  '` +
    req.body.Keterangan +
    `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});


//Post Untuk input Keluar Kantor manual
app.post("/api/keluarkantormanual", (req, res) => {
  let parsing = {   KeluarKantor : moment.parseZone(moment()).format('HH:mm:ss'),UserID: req.body.UserID,Nama: req.body.NamaUser}
  let sql =
    `CALL ProsesKeluarKantor (
  '` +
    req.body.DatangID +
    `',
  '` +
    parsing.KeluarKantor +
    `',
  '` +
    req.body.Keterangan +
    `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(parsing));
  });
});

//GET Data KeluarID untuk karyawan yang sama sesuai datang id dan validasi
// untuk prosesi validasi scan balik kantor  karyawan

app.get("/api/keluarkantor/:id", (req, res) => {
  conn.query(
    `CALL MengambilKeluarID ('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let datang = rows[0];
      res.send(datang);
    }
  );
});

//GET List Jam Scan Keluar & Kembali Ke Kantor

app.get("/api/keluarkantor/:id", (req, res) => {
  conn.query(
    `CALL ListKeluarKantor ('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let datang = rows[0];
      res.send(datang);
    }
  );
});

//Put data untuk update scan kembali Kantor setelah mendapatkan KeluarID

app.put("/api/keluarkantor/:id", (req, res) => {
  let sql =
    `CALL ProsesKembaliKantor (
    '` +
    req.params.id +
    `',
    '` +
    req.body.JamKembali +
    `',
    '` +
    req.body.KeteranganKembali +
    `'
    )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify());
  });
});

//Put data untuk update scan kembali Kantor setelah mendapatkan KeluarID

app.put("/api/keluarkantormanual/:id", (req, res) => {
  let parsing = {   KeluarKantor : moment.parseZone(moment()).format('HH:mm:ss'),UserID: req.body.UserID,Nama: req.body.NamaUser}
  let sql =
    `CALL ProsesKembaliKantor (
    '` +
    req.params.id +
    `',
    '` +
    parsing.KeluarKantor +
    `',
    '` +
    req.body.KeteranganKembali +
    `'
    )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(parsing));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////

/////////////       API BERHUBUNGAN DENGAN DATA ISTIRAHAT KANTOR        /////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//Put Untuk input Istirahat Kantor Menggunakan Datang ID
app.put("/api/istirahat/:id", (req, res) => {
  
  let sql =
    `CALL ProsesIstirahatKeluar(
  '` +
    req.params.id +
    `',
  '` +
    req.body.IstirahatKeluar +
    `',
  '` +
    req.body.KetIstirahatKeluar +
    `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Put Untuk input Istirahat Kantor Menggunakan Datang ID Manual
app.put("/api/istirahatmanual/:id", (req, res) => {
  let parsing = {   KeluarKantor : moment.parseZone(moment()).format('HH:mm:ss'), UserID: req.body.UserID,Nama: req.body.NamaUser}
  let sql =
    `CALL ProsesIstirahatKeluar(
  '` +
    req.params.id +
    `',
  '` +
  parsing.KeluarKantor +
    `',
  '` +
    req.body.KetIstirahatKeluar +
    `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(parsing));
  });
});

//Put data untuk Istirahat Kembali

app.put("/api/istirahatkembali/:id", (req, res) => {
  let sql =
    `CALL ProsesIstirahatKembali (
    '` +
    req.params.id +
    `',
    '` +
    req.body.IstirahatKembali +
    `',
    '` +
    req.body.KetIstirahatKembali +
    `'
    )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Put data untuk Istirahat Kembali

app.put("/api/istirahatkembalimanual/:id", (req, res) => {
  let parsing = {   KeluarKantor : moment.parseZone(moment()).format('HH:mm:ss'),UserID: req.body.UserID,Nama: req.body.NamaUser}
  let sql =
    `CALL ProsesIstirahatKembali (
    '` +
    req.params.id +
    `',
    '` +
    parsing.KeluarKantor+
    `',
    '` +
    req.body.KetIstirahatKembali +
    `'
    )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(parsing));
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        API BERHUBUNGAN DENGAN DATA USER         ////////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//Menampilkan Seluruh List User untuk table data karyawan di web admin

app.get("/api/user", (req, res) => {
  conn.query(`CALL MenampilkanUser`, function (err, rows) {
    if (err) throw err;
    let user = rows[0];
    res.send(user);
  });
});

//menampilkan detail user  data  berdasarkan User ID
app.get("/api/user/:id", (req, res) => {
  conn.query(
    `CALL MenampilkanDetailUser('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let user = rows[0];
      let detailuser = user[0];
      res.send(detailuser);
    }
  );
});

//Tambahkan data user untuk panel admin
app.post("/api/user", (req, res) => {
  let data = {
    Nama: req.body.Nama,
    UserID: req.body.UserID,
    Pass: 'e10adc3949ba59abbe56e057f20f883e',
  };

  let sql =
    `CALL MenambahUser (
  '` +
    req.body.UserID +
    `',
  '` +
    data.Pass +
    `',
  '` +
    req.body.Nama +
    `',
  '` +
    req.body.Alamat +
    `',
  '` +
    req.body.TglLahir +
    `',
  '` +
    req.body.HP +
    `',
  '` +
    req.body.TglMasuk +
    `',
  '` +
    req.body.TglMulaiCuti +
    `',
  '` +
    req.body.TglAwalKontrakPertama +
    `',
  '` +
    req.body.GroupID +
    `',
  '` +
    req.body.KodeCabang +
    `',
  '` +
    req.body.Status +
    `',
  '` +
    req.body.TampilkanLembur +
    `',
    '` +
    req.body.RoleID +
    `',
    '` +
    req.body.Posisi +
    `',
  '` +
    req.body.TampilkanTerlambat +
    `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});


//Edit User
app.put("/api/user/:id", (req, res) => {
  let data = {
    Nama: req.body.Nama,
    UserID: req.body.UserID,
  };

  let sql =
  `CALL EditUser (
  '` +
  req.params.id +
  `',
'` +
  req.body.Nama +
  `',
'` +
  req.body.Alamat +
  `',
'` +
  req.body.TglLahir +
  `',
'` +
  req.body.HP +
  `',
'` +
  req.body.TglMasuk +
  `',
'` +
  req.body.TglMulaiCuti +
  `',
'` +
  req.body.TglAwalKontrakPertama +
  `',
'` +
  req.body.GroupID +
  `',
'` +
  req.body.KodeCabang +
  `',
'` +
  req.body.Status +
  `',
'` +
  req.body.TampilkanLembur +
  `',
'` +
  req.body.RoleID +
  `',
'` +
  req.body.Posisi +
  `',
'` +
  req.body.TampilkanTerlambat +
  `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Mengedit data user untuk panel admin
app.put("/api/usertest/:id", (req, res) => {
  let data = {
    Nama: req.body.Nama,
    UserID: req.body.UserID,
    Pass: md5(req.body.Pass),
    TglAwalKontrakPertama: req.body.TglAwalKontrakPertama,
    TglMulaiCuti: req.body.TglMulaiCuti,

  };

  let sql =
    `CALL EditUser (
    '` +
    req.params.id +
    `',
    '` +
    data.Pass +
    `',
  '` +
    req.body.Nama +
    `',
  '` +
    req.body.Alamat +
    `',
  '` +
    req.body.TglLahir +
    `',
  '` +
    req.body.HP +
    `',
  '` +
    req.body.TglMasuk +
    `',
  '` +
    req.body.TglMulaiCuti +
    `',
  '` +
    req.body.TglAwalKontrakPertama +
    `',
  '` +
    req.body.GroupID +
    `',
  '` +
    req.body.KodeCabang +
    `',
  '` +
    req.body.Status +
    `',
  '` +
    req.body.TampilkanLembur +
    `',
  '` +
    req.body.RoleID +
    `',
  '` +
    req.body.Posisi +
    `',
  '` +
    req.body.TampilkanTerlambat +
    `'
    )`;


  ///// Tnpa Tanggal Awal Kontrak Dan Tanpa Tanggal  Awla Cuti
  let sql2 =
    `CALL EditUserTKC (
    '` +
    req.params.id +
    `',
    '` +
    data.Pass +
    `',
  '` +
    req.body.Nama +
    `',
  '` +
    req.body.Alamat +
    `',
  '` +
    req.body.TglLahir +
    `',
  '` +
    req.body.HP +
    `',
  '` +
    req.body.TglMasuk +
    `',
  '` +
    req.body.GroupID +
    `',
  '` +
    req.body.KodeCabang +
    `',
  '` +
    req.body.Status +
    `',
  '` +
    req.body.TampilkanLembur +
    `',
  '` +
    req.body.RoleID +
    `',
  '` +
    req.body.Posisi +
    `',
  '` +
    req.body.TampilkanTerlambat +
    `'
    )`;


  /// Tanpa Tanggal Awal Kontrak Pertama
  let sql3 =
    `CALL EditUserT (
'` +
    req.params.id +
    `',
'` +
    data.Pass +
    `',
'` +
    req.body.Nama +
    `',
'` +
    req.body.Alamat +
    `',
'` +
    req.body.TglLahir +
    `',
'` +
    req.body.HP +
    `',
'` +
    req.body.TglMasuk +
    `',
'` +
    req.body.TglMulaiCuti +
    `',
'` +
    req.body.GroupID +
    `',
'` +
    req.body.KodeCabang +
    `',
'` +
    req.body.Status +
    `',
'` +
    req.body.TampilkanLembur +
    `',
'` +
    req.body.RoleID +
    `',
'` +
    req.body.Posisi +
    `',
'` +
    req.body.TampilkanTerlambat +
    `'
)`;


  // Tanpa Tanggal Mulai Cuti
  let sql4 =
    `CALL EditUserC (
'` +
    req.params.id +
    `',
'` +
    data.Pass +
    `',
'` +
    req.body.Nama +
    `',
'` +
    req.body.Alamat +
    `',
'` +
    req.body.TglLahir +
    `',
'` +
    req.body.HP +
    `',
'` +
    req.body.TglMasuk +
    `',
'` +
    req.body.TglAwalKontrakPertama +
    `',
'` +
    req.body.GroupID +
    `',
'` +
    req.body.KodeCabang +
    `',
'` +
    req.body.Status +
    `',
'` +
    req.body.TampilkanLembur +
    `',
'` +
    req.body.RoleID +
    `',
'` +
    req.body.Posisi +
    `',
'` +
    req.body.TampilkanTerlambat +
    `'
)`;


  if (data.TglAwalKontrakPertama && data.TglMulaiCuti == undefined) {
    conn.query(sql2, function (error, results) {
      if (error) {
        res.json({
          Error: true,
          Message: "Eror Rest Sql2",
        })
      } else {
        res.json({
          Error: false,
          Message: "Berhasil yokkk",
          Data,
          results,
        })
      }
    });
  }
  else {
    if (data.TglAwalKontrakPertama == undefined) {
      conn.query(sql3, function (error, results) {
        if (error) {
          res.json({
            Error: true,
            Message: "Eror Rest Sql3",
          })
        } else {
          res.json({
            Error: false,
            Message: "Berhasil yokkk sql 3",
            Data,
            results,
          })
        }
      });
    }
    else {
            if (data.TglMulaiCuti == undefined) {
                    conn.query(sql4, function (error, results) {
                            if (error) {
                              res.json({
                                Error: true,
                                Message: "Eror Rest Sql4 ",
                              })
                            } else {
                              res.json({
                                Error: false,
                                Message: "Berhasil yokkk sql 4",
                                Data,
                                results,
                              })
                            }
                     });
           {
                  conn.query(sql1, function (error, results) {
                              if (error) {
                                res.json({
                                  Error: true,
                                  Message: "Eror Rest Sql",
                                })
                              } else {
                                res.json({
                                  Error: false,
                                  Message: "Berhasil yokkk sql",
                                  Data,
                                  results,
                                      })}
                             });
                  };
            };
    };
  };
});


// Api untuk proses login di APP
app.post("/api/logindev", (req, res) => {
  let post = {
    Pass: req.body.Pass,
    UserID: req.body.UserID,
    DeviceID: req.body.DeviceID,
  };

  //conn.query(
  // `SELECT DeviceID FROM user Where UserID="` + req.body.UserID + `" AND Pass="` + req.body.Pass +`"`;
  // function (err, rows) {
  //    if (err) throw err;
  //    let DvID = rows[0];
  //  }
  // );
  //  let DevID = rows[0];
  // let DvI = DevID.DeviceID

  let query = "Select DeviceID,RoleID,UserID FROM ?? WHERE (??=? AND ??=? AND ??=?) OR (??=? AND ??=? AND ??=?)";
  let table = [
    "user",
    "Pass",
    md5(post.Pass),
    "UserID",
    post.UserID,
    "DeviceID",
    post.DeviceID,
    "Pass",
    md5(post.Pass),
    "Username",
    post.UserID,
    "DeviceID",
    post.DeviceID,
  ];

  let query2 =
    `UPDATE user SET DeviceID="` +
    req.body.DeviceID +
    `" WHERE UserID="` +
    req.body.UserID +
    `" OR Username="` +
    post.UserID +
    `"`;

  let query3 =
    `SELECT DeviceID,RoleID,UserID FROM user Where (UserID="` +
    req.body.UserID +
    `" AND Pass="` +
    md5(post.Pass) +
    `") OR (Username="` +
    post.UserID +
    `" AND Pass="` +
    md5(post.Pass) +
    `")`;

  query = mysql.format(query, table);

  conn.query(query, function (error, rows) {
    if (error) {
      console.log(error);
    } else {
      if (rows.length == 1) {
        let Ambil = rows[0];
        let UID = Ambil.UserID;
        console.log(UID);
        console.log(Ambil);

        let Role = Ambil.RoleID;
        res.json({ Message: "OK", Role, UID });
      } else {
        conn.query(query3, function (error, rows) {
          if (error) {
            console.log(error);
          } else {
            if (rows.length == 1) {
              let DvcID = rows[0];
              let DvID = DvcID.DeviceID;
              if (rows.length == 1 && DvID == "") {
                conn.query(query2, (err) => {
                  let Ambil = rows[0];
                  let UID = Ambil.UserID;
                  let Role = Ambil.RoleID;
                  if (err) throw err;
                  res.json({ Message: "OK", Role, UID });
                });
              } else {
                res.json({
                  Error: true,
                  Message:
                    "Device Tidak Sesuai, Segera Hubungi Admin Jika Ganti Device",
                });
              }
            } else {
              res.json({
                Error: true,
                Message: "Username atau Password Salah",
              });
            }
          }
        });
      }
    }
  });
});


//////////////
/// MENGEDIT USERNAME dan PASSWORD
///////////////

app.put("/api/username/:id", (req, res) => {
  let data = {
    Username: req.body.Username,
    Pass: req.body.Pass,
  };
  let sql =
    `UPDATE user SET Username="` +
    req.body.Username +
    `", Pass="` +
    md5(req.body.Pass) +
    `" WHERE UserID="` +
    req.params.id +
    `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) {
      let pesan = err.sqlMessage;
      res.json({ message: pesan });
    }
    else {
      res.send(JSON.stringify(results));
    }
  });
});

///////////////

//////////////
/// MENGEDIT USERNAME dan PASSWORD
///////////////

app.put("/api/resetdevice/:id", (req, res) => {
  let data = {
    UserID: req.params.id,
  };
  let sql = `UPDATE user SET DeviceID="" WHERE UserID="` + req.params.id + `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});


//////
app.put("/api/resetpassworduser/:id", (req, res) => {
  let data = {
    UserID: req.params.id,
    Pass: 'e10adc3949ba59abbe56e057f20f883e',
  };
  let sql = `UPDATE user SET Pass="`+data.Pass+`" WHERE UserID="` + req.params.id + `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

///////////////

//Menampilkan Detail grup Per ID Pegawai
app.get("/api/usertest/:id", (req, res) => {
  conn.query(
    `SELECT * FROM user Where UserID="` + req.params.id + `"`,
    function (err, rows) {
      if (err) throw err;
      let group = rows[0];
      res.send(group);
    }
  );
});

//Menghapus data user untuk panel admin
app.delete("/api/user/:id", (req, res) => {
  let sql = `DELETE FROM user WHERE UserID="` + req.params.id + `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

////////////////////////////////////////////////////////////////////////////////////////////

///////////////        API BERHUBUNGAN DENGAN DATA ROLE PEGAWAI         ///////////////////

///////////////////////////////////////////////////////////////////////////////////////////

// Menampilkan Role User Previlage untuk acc izin & lembur
app.get("/api/roleuser", (req, res) => {
  let sql = "SELECT * FROM role";
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

////////////////////////////////////////////////////////////////////////////////////////////

///////////////           API BERHUBUNGAN DENGAN DATA GROUP           ///////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//Menampilkan Semua List Group Pegawai
app.get("/api/group", (req, res) => {
  let sql = "SELECT * FROM tblgrupjabatan";
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Menampilkan Detail grup Per ID Pegawai
app.get("/api/group/:id", (req, res) => {
  conn.query(
    `SELECT * FROM tblgrupjabatan Where GroupID="` + req.params.id + `"`,
    function (err, rows) {
      if (err) throw err;
      let group = rows[0];
      res.send(group);
    }
  );
});

//Menampilkan Detail grup Per ID Pegawai
app.get("/api/TerlambatBertingkat/:id", (req, res) => {
  conn.query(
    `SELECT * FROM tblruleterlambatbertingkat Where GroupID="` + req.params.id + `"`,
    function (err, rows) {
      if (err) throw err;
      res.send(rows);
    }
  );
});

//Menampilkan Detail grup Per ID Pegawai
app.get("/api/TerlambatBertingkat2/:id", (req, res) => {
  conn.query(
    `SELECT * FROM tblruleterlambatbertingkat Where RuleTerlambatBertingkatID="` + req.params.id + `"`,
    function (err, rows) {
      if (err) throw err;
      detail = rows[0];
      res.send(detail);
    }
  );
});


//Menambahkan Data Cabang dengan kode cabang dan nama cabang
app.post("/api/TerlambatBertingkat", (req, res) => {
  let data = {
    GroupID: req.body.GroupID,
    Shift: req.body.Shift,
    MaxJamDatang: req.body.MaxJamDatang,
    RpPotonganTerlambat: req.body.RpPotonganTerlambat,
  };
  let sql = "INSERT INTO tblruleterlambatbertingkat SET ?";
  let query = conn.query(sql, data, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Mengedit Nama Cabang untuk untuk panel admin
app.put("/api/TerlambatBertingkat/:id", (req, res) => {
  let data = {
    GroupID: req.body.GroupID,
    Shift: req.body.Shift,
    MaxJamDatang: req.body.MaxJamDatang,
    RpPotonganTerlambat: req.body.RpPotonganTerlambat,
  };
  let sql =
    `UPDATE tblruleterlambatbertingkat SET MaxJamDatang="` +
    req.body.MaxJamDatang +
    `", RpPotonganTerlambat="` +
    req.body.RpPotonganTerlambat +
    `" WHERE RuleTerlambatBertingkatID="` +
    req.params.id +
    `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Menghapus data cabang untuk panel admin
app.delete("/api/TerlambatBertingkat/:id", (req, res) => {
  let sql = `DELETE FROM tblruleterlambatbertingkat WHERE RuleTerlambatBertingkatID="` + req.params.id + `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});



//Tambahkan data GROUP untuk panel admin
app.post("/api/group", (req, res) => {
  let data = {
    GroupID: req.body.GroupID,
    Jabatan: req.body.Jabatan,
    AdaOff: req.body.AdaOff,
    CekJamKembali: req.body.CekJamKembali,
    RuleTerlambatBertingkat: req.body.RuleTerlambatBertingkat,
    JamDatang: req.body.JamDatang,
    MaxJamDatang: req.body.MaxJamDatang,
    JamPulang: req.body.JamPulang,
    MinJamLembur: req.body.MinJamLembur,
    JamMulaiLembur: req.body.JamMulaiLembur,
    RpPotonganTerlambat: req.body.RpPotonganTerlambat,
    JamDatangSiang: req.body.JamDatangSiang,
    MaxJamDatangSiang: req.body.MaxJamDatangSiang,
    JamPulangSiang: req.body.JamPulangSiang,
    JamMulaiLemburSiang: req.body.JamMulaiLemburSiang,
    MinJamLemburSiang: req.body.MinJamLemburSiang,
    HariLibur: req.body.HariLibur,
    RpPotonganTerlambatKembali: req.body.RpPotonganTerlambatKembali,
    RpPotonganTidakMasuk: req.body.RpPotonganTidakMasuk,
    RpLemburPerJam: req.body.RpLemburPerJam,
    JamDatangSore: req.body.JamDatangSore,
    MaxJamDatangSore: req.body.MaxJamDatangSore,
    JamPulangSore: req.body.JamPulangSore,
    MinJamLemburSore: req.body.MinJamLemburSore,
    JamMulaiLemburSore: req.body.JamMulaiLemburSore,
    JamMulaiPagi: req.body.JamMulaiPagi,
    MaxJamKembali: req.body.MaxJamKembali,
    JamMulaiSiang: req.body.JamMulaiSiang,
    MaxJamKembaliSiang: req.body.MaxJamKembaliSiang,
    JamMulaiSore: req.body.JamMulaiSore,
    MaxJamKembaliSore: req.body.MaxJamKembaliSore,
  };

  let sql =
    `CALL MenambahkanGrupKaryawan (
  '` +
    req.body.GroupID +
    `',
  '` +
    req.body.Jabatan +
    `',
  '` +
    req.body.AdaOff +
    `',
  '` +
    req.body.CekJamKembali +
    `',
  '` +
    req.body.RuleTerlambatBertingkat +
    `',
  '` +
    req.body.JamDatang +
    `',
  '` +
    req.body.MaxJamDatang +
    `',
  '` +
    req.body.JamPulang +
    `',
  '` +
    req.body.MinJamLembur +
    `',
  '` +
    req.body.JamMulaiLembur +
    `',
  '` +
    req.body.RpPotonganTerlambat +
    `',
  '` +
    req.body.JamDatangSiang +
    `',
  '` +
    req.body.MaxJamDatangSiang +
    `',
  '` +
    req.body.JamPulangSiang +
    `',
  '` +
    req.body.JamMulaiLemburSiang +
    `',
  '` +
    req.body.MinJamLemburSiang +
    `',
  '` +
    req.body.HariLibur +
    `',
  '` +
    req.body.RpPotonganTerlambatKembali +
    `',
  '` +
    req.body.RpPotonganTidakMasuk +
    `',
  '` +
    req.body.RpLemburPerJam +
    `',
    '` +
    req.body.JamDatangSore +
    `',
    '` +
    req.body.MaxJamDatangSore +
    `',
    '` +
    req.body.JamPulangSore +
    `',
    '` +
    req.body.MinJamLemburSore +
    `',
    '` +
    req.body.JamMulaiLemburSore +
    `',
    '` +
    req.body.JamMulaiPagi +
    `',
    '` +
    req.body.MaxJamKembali +
    `',
    '` +
    req.body.JamMulaiSiang +
    `',
    '` +
    req.body.MaxJamKembaliSiang +
    `',
  '` +
    req.body.JamMulaiSore +
    `',
  '` +
    req.body.MaxJamKembaliSore +
    `'
  )`;
  let query = conn.query(sql, data, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Mengedit Data GROUP untuk panel admin
app.put("/api/group/:id", (req, res) => {
  let sql =
    `CALL EditGroupKaryawan (
  '` +
    req.body.GroupID +
    `',
  '` +
    req.body.Jabatan +
    `',
  '` +
    req.body.AdaOff +
    `',
  '` +
    req.body.CekJamKembali +
    `',
  '` +
    req.body.RuleTerlambatBertingkat +
    `',
  '` +
    req.body.JamDatang +
    `',
  '` +
    req.body.MaxJamDatang +
    `',
  '` +
    req.body.JamPulang +
    `',
  '` +
    req.body.MinJamLembur +
    `',
  '` +
    req.body.JamMulaiLembur +
    `',
  '` +
    req.body.RpPotonganTerlambat +
    `',
  '` +
    req.body.JamDatangSiang +
    `',
  '` +
    req.body.MaxJamDatangSiang +
    `',
  '` +
    req.body.JamPulangSiang +
    `',
  '` +
    req.body.JamMulaiLemburSiang +
    `',
  '` +
    req.body.MinJamLemburSiang +
    `',
  '` +
    req.body.HariLibur +
    `',
  '` +
    req.body.RpPotonganTerlambatKembali +
    `',
  '` +
    req.body.RpPotonganTidakMasuk +
    `',
  '` +
    req.body.RpLemburPerJam +
    `',
    '` +
    req.body.JamDatangSore +
    `',
    '` +
    req.body.MaxJamDatangSore +
    `',
    '` +
    req.body.JamPulangSore +
    `',
    '` +
    req.body.MinJamLemburSore +
    `',
    '` +
    req.body.JamMulaiLemburSore +
    `',
    '` +
    req.body.JamMulaiPagi +
    `',
    '` +
    req.body.MaxJamKembali +
    `',
    '` +
    req.body.JamMulaiSiang +
    `',
    '` +
    req.body.MaxJamKembaliSiang +
    `',
  '` +
    req.body.JamMulaiSore +
    `',
  '` +
    req.body.MaxJamKembaliSore +
    `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Menghapus data Group untuk panel admin
app.delete("/api/group/:id", (req, res) => {
  let sql = `DELETE FROM tblgrupjabatan WHERE GroupID="` + req.params.id + `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        API BERHUBUNGAN DENGAN CABANG         ///////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//Menampilkan seluruh data cabang yang sudah terdaftar di panel admin
app.get("/api/cabang", (req, res) => {
  let sql = "SELECT * FROM cabang";
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Menampilkan detai data cabang yang sudah terdaftar di panel admin
app.get("/api/cabang/:id", (req, res) => {
  conn.query(
    `SELECT * FROM cabang Where KodeCabang="` + req.params.id + `"`,
    function (err, rows) {
      if (err) throw err;
      let cabang = rows[0];
      res.send(cabang);
    }
  );
});

//Menambahkan Data Cabang dengan kode cabang dan nama cabang
app.post("/api/cabang", (req, res) => {
  let data = {
    KodeCabang: req.body.KodeCabang,
    NamaCabang: req.body.NamaCabang,
    Alamat: req.body.Alamat,
    NoTelp: req.body.NoTelp,
    GeneralManagerID: req.body.GeneralManagerID,
    hrdID: req.body.hrdID,
  };
  let sql = "INSERT INTO cabang SET ?";
  let query = conn.query(sql, data, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Mengedit Nama Cabang untuk untuk panel admin
app.put("/api/cabang/:id", (req, res) => {
  let data = {
    KodeCabang: req.body.KodeCabang,
    NamaCabang: req.body.NamaCabang,
  };
  let sql =
    `UPDATE cabang SET NamaCabang="` +
    req.body.NamaCabang +
    `", Alamat="` +
    req.body.Alamat +
    `", NoTelp="` +
    req.body.NoTelp +
    `", GeneralManagerID="` +
    req.body.GeneralManagerID +
    `", hrdID="` +
    req.body.hrdID +
    `" WHERE KodeCabang="` +
    req.params.id +
    `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Menghapus data cabang untuk panel admin
app.delete("/api/cabang/:id", (req, res) => {
  let sql = `DELETE FROM cabang WHERE KodeCabang="` + req.params.id + `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        API BERHUBUNGAN DENGAN LOGIN         ///////////////////////

///////////////////////////////////////////////////////////////////////////////////////////

// Api untuk proses login di APP
app.post("/api/login", (req, res) => {
  let data = {
    Password: md5(req.body.Password),
    AdminID: req.body.AdminID,
  };
  let query = "Select * FROM ?? WHERE ??=? AND ??=?";
  let table = ["admin", "Password", data.Password, "AdminID", data.AdminID];

  query = mysql.format(query, table);
  conn.query(query, function (err, rows) {
    if (err) {
      throw err;
    } else {
      if (rows.length == 1) {
        res.json({ AdminID: rows[0].AdminID, RoleAdmin : rows[0].RoleAdmin, message: "OK" , Login: "true" });
      } else {
        res.json({ message: "Username Passoword Salah" , Login: "false" });
      }
    }
  });
});


//
app.post("/api/loginsu", (req, res) => {
  let data = {
    AdminID: req.body.AdminID,
    Password: req.body.Password,
  };
  let sql = "INSERT INTO admin SET ?";
  let query = conn.query(sql, data, (err, results) => {
    if (err) throw err;
    res.json({ Message: "OK"});;
  });
});

/////////////////////////////////////////////////
////////////////////////////////////////////////

// Api untuk proses login di APP
app.post("/api/logindev", (req, res) => {
  let post = {
    Pass: req.body.Pass,
    UserID: req.body.UserID,
    DeviceID: req.body.DeviceID,
  };

  //conn.query(
  // `SELECT DeviceID FROM user Where UserID="` + req.body.UserID + `" AND Pass="` + req.body.Pass +`"`;
  // function (err, rows) {
  //    if (err) throw err;
  //    let DvID = rows[0];
  //  }
  // );
  //  let DevID = rows[0];
  // let DvI = DevID.DeviceID

  let query = "Select DeviceID,RoleID,UserID FROM ?? WHERE (??=? AND ??=? AND ??=?) OR (??=? AND ??=? AND ??=?)";
  let table = [
    "user",
    "Pass",
    md5(post.Pass),
    "UserID",
    post.UserID,
    "DeviceID",
    post.DeviceID,
    "Pass",
    md5(post.Pass),
    "Username",
    post.UserID,
    "DeviceID",
    post.DeviceID,
  ];

  let query2 =
    `UPDATE user SET DeviceID="` +
    req.body.DeviceID +
    `" WHERE UserID="` +
    req.body.UserID +
    `" OR Username="` +
    post.UserID +
    `"`;

  let query3 =
    `SELECT DeviceID,RoleID,UserID FROM user Where (UserID="` +
    req.body.UserID +
    `" AND Pass="` +
    md5(post.Pass) +
    `") OR (Username="` +
    post.UserID +
    `" AND Pass="` +
    md5(post.Pass) +
    `")`;

  query = mysql.format(query, table);

  conn.query(query, function (error, rows) {
    if (error) {
      console.log(error);
    } else {
      if (rows.length == 1) {
        let Ambil = rows[0];
        let UID = Ambil.UserID;
        console.log(UID);
        console.log(Ambil);

        let Role = Ambil.RoleID;
        res.json({ Message: "OK", Role, UID });
      } else {
        conn.query(query3, function (error, rows) {
          if (error) {
            console.log(error);
          } else {
            if (rows.length == 1) {
              let DvcID = rows[0];
              let DvID = DvcID.DeviceID;
              if (rows.length == 1 && DvID == "") {
                conn.query(query2, (err) => {
                  let Ambil = rows[0];
                  let UID = Ambil.UserID;
                  let Role = Ambil.RoleID;
                  if (err) throw err;
                  res.json({ Message: "OK", Role, UID });
                });
              } else {
                res.json({
                  Error: true,
                  Message:
                    "Device Tidak Sesuai, Segera Hubungi Admin Jika Ganti Device",
                });
              }
            } else {
              res.json({
                Error: true,
                Message: "Username atau Password Salah",
              });
            }
          }
        });
      }
    }
  });
});

////////////////////////////////////////////////////////////////////////////////////////////
// Api untuk proses login di APP
app.post("/api/loginLengkap", (req, res) => {
  let post = {
    Pass: req.body.Pass,
    UserID: req.body.UserID,
  };
  let query = "Select * FROM ?? WHERE ??=? AND ??=?";
  let table = ["user", "Pass", post.Pass, "UserID", post.UserID];
  query = mysql.format(query, table);
  let grup;
  let kodecabang;
  conn.query(query, function (error, rows) {
    grup = rows[0].GroupID;
    kodecabang = rows[0].KodeCabang;
    console.log(grup);
    console.log(kodecabang);
    if (error) {
      console.log("error karena -->" + error);
    } else {
      if (rows.length == 1) {
        console.log("INI masuk " + error);
        //res.json({ Error: true, Message: "OK rubah", GroupID: grup, KodeCabang:kodecabang });
      } else {
        console.log("INI keluar " + error);
        //res.json({ Error: true, Message: "UserID atau Pass salah!" });
      }
    }
  });
  console.log("Model console 2");
  let post2 = {
    grup2: grup,
    kodecabang2: kodecabang,
  };
  console.log("Model console 2b");
  let query2 = "Select * FROM ?? WHERE ??=? ";
  let table2 = ["tblgrupjabatan", "GroupID", post2.grup];

  console.log("Model console 2c");

  query2 = mysql.format(query2, table2);
  console.log("Model console 2d");
  conn2.query(query2, function (error2, rows2) {
    let jamdatang = rows2[0].JamDatang;
    let maxjamdatang = rows2[0].MaxJamDatang;
    console.log("Model console 2e");
    console.log(jamdatang);
    console.log(maxjamdatang);
    if (error2) {
      console.log(error2);
    } else {
      if (rows2.length == 1) {
        res.json({
          Error: true,
          Message: "OK rubah",
          GroupID: grup,
          MaxJamDatang: maxjamdatang,
        });
      } else {
        res.json({
          Error: true,
          Message: "UserID atau Pass salah!",
        });
      }
    }
  });
  console.log("Model console 2f");
});

////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        API BERHUBUNGAN DENGAN DATA IZIN        ////////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//tampilkan Request (view untuk jabatan level 1)

app.get("/api/izin", (req, res) => {
  conn.query(`CALL MenampilkanIzin`, function (err, rows) {
    if (err) throw err;
    let izin = rows[0];
    res.send(izin);
  });
});

app.get("/api/izinsolo/:id&:TglAwal&:TglAkhir", (req, res) => {
  conn.query(`CALL MenampilkanAbsensiPerOrang('` +
  req.params.id +
  `','` +
  req.params.TglAwal +
  `','` +
  req.params.TglAkhir +
  `')`, function (err, rows) {
    if (err) throw err;
    let izin = rows[0];
    res.send(izin);
  });
});

//tampilkan data izin yang sudah diterima berdasakan id
app.get("/api/izin/:id", (req, res) => {
  conn.query(
    `CALL MenampilkanDetailIzin('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let izin = rows[0];
      let detailizin = izin[0];
      res.send(detailizin);
    }
  );
});

//tampilkan detail data absensi berdasarkan DatangID
app.get("/api/detailabsensi/:id", (req, res) => {
  conn.query(
    `CALL MenampilkanDetailAbsensi('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let izin = rows[0];
      let detailizin = izin[0];
      res.send(detailizin);
    }
  );
});

//Tambahkan data user untuk panel admin
app.post("/api/izin", (req, res) => {
  let data = {
    TanggalScan: req.body.TanggalScan,
    UserID: req.body.UserID,
    Status: req.body.Status,
    Keterangan: req.body.Keterangan,
  };
  let sql =
    `CALL InputIzinPerorang (
  '` +
    req.body.UserID +
    `',
  '` +
    req.body.TanggalScan +
    `',
  '` +
    req.body.Status +
    `',
  '` +
    req.body.Keterangan +
    `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Update data absensi per orang
app.put("/api/izin/:id", (req, res) => {
  let data = {
    DatangID: req.params.id,
    TanggalScan: req.body.TanggalScan,
    UserID: req.body.UserID,
    Status: req.body.Status,
    Keterangan: req.body.Keterangan,
  };

  conn.query(
    `CALL UpdateIzinAbsensiPerOrang(
      ` + req.params.id + `,
      '` + req.body.UserID + `',
      '` + req.body.TanggalScan + `',
      '` + req.body.Status + `',
      '` + req.body.Keterangan + `'
    )`,
    function (err, rows) {
      if (err) throw err;
      res.send(JSON.stringify(data));
    }
  );
});

app.post("/api/izingroup", (req, res) => {
  let sql =
    `CALL InputIzinPergroup (
  '` +
    req.body.GroupID +
    `',
  '` +
    req.body.TanggalScan +
    `',
  '` +
    req.body.Status +
    `',
  '` +
    req.body.Keterangan +
    `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Menghapus data izin untuk panel admin
app.delete("/api/izin/:id", (req, res) => {
  let sql = `DELETE FROM attlog WHERE DatangID="` + req.params.id + `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        API BERHUBUNGAN DENGAN DATA WAKTU        ////////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//Mengambil waktu server dan data jam kerja untuk APP bisa scan

app.get("/api/gettime", (req, res) => {
  let sql = `SELECT Now() as Waktu`;
  let query = conn.query(sql, (err, results) => {
    if (err) res.send(JSON.stringify(err));
    res.send(JSON.stringify(results));
  });
});

//Mengambil waktu server dan data jam kerja untuk APP bisa scan

app.get("/api/gettime2", (req, res) => {
  let sql = `SELECT DATE_FORMAT(NOW(), "%d %m %Y - %T")as Waktu`;
  let query = conn.query(sql, (err, results) => {
    if (err) res.send(JSON.stringify(err));
    test = results[0]
    res.send(JSON.stringify(test));
  });
});

//menampilkan report summary perbulan
app.get("/api/sumreport/:id", (req, res) => {
  conn.query(
    `CALL AppReportPerbulan('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let user = rows[0];
      let detailuser = user[0];
      res.send(detailuser);
    }
  );
});

//menampilkan report summary perbulan
app.get("/api/rekaptahun/:id", (req, res) => {
  conn.query(
    `CALL AppRekapPertahun('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let user = rows[0];
      let detailuser = user[0];
      res.send(detailuser);
    }
  );
});

// Menampilkan Recent Scan Untuk APP Android Berdasarkan Tgl Mulai Dan Tgl Akhir
app.get("/api/laporanrekap/:id&:TglAwal&:TglAkhir", (req, res) => {
  conn.query(
    `CALL ReportPertanggal ('` +
    req.params.id +
    `','` +
    req.params.TglAwal +
    `','` +
    req.params.TglAkhir +
    `')`,
    function (err, rows) {
      if (err) throw err;
      let rek = rows[0];
      let det = rek[0];
      res.send(det);
    }
  );
});

//menampilkan report summary perbulan
app.get("/api/headerlaporan/:id", (req, res) => {
  conn.query(
    `CALL HeaderLaporan('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let user = rows[0];
      let detailuser = user[0];
      res.send(detailuser);
    }
  );
});

////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        TRIAL REPPORT API       ////////////////////

///////////////////////////////////////////////////////////////////////////////////////////

app.get("/api/reportabsen/:id&:tglin&:tglout", (req, res) => {
  let sql =
    `SELECT DAYNAME(c.Tanggal)as NamaHari, DAY(c.Tanggal) as Hari, MONTH(c.Tanggal)as Bulan, YEAR(c.Tanggal) as Tahun,
  IFNULL((SELECT a.UserID FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as USERID,
  IFNULL((SELECT b.Nama FROM attlog a, user b WHERE c.Tanggal = a.TanggalScan AND a.UserID = b.UserID AND a.UserID="` +
    req.params.id +
    `" ),"TIDAK MASUK") as Nama,
  IFNULL((SELECT a.ScanMasuk FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as ScanMasuk,
  IFNULL((SELECT a.ScanPulang FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as ScanPulang,
  IFNULL((SELECT a.Shift FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as Shift,

  IFNULL((SELECT IF(TIMEDIFF(a.ScanMasuk,'08:00:00') < '00:05:00','-','1') FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as JumlahTerlambat,
  IFNULL((SELECT IF(TIMEDIFF(a.ScanMasuk,'08:00:00') < '00:05:00','-',TIMEDIFF(a.ScanMasuk,'08:00:00')) FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as Terlambat,


  IFNULL((SELECT IF(TIMEDIFF(a.ScanPulang,'16:00:00') < '00:30:00','-',TIMEDIFF(a.ScanPulang,'16:00:00')) FROM attlog a WHERE c.Tanggal = a.TanggalScan AND a.UserID="` +
    req.params.id +
    `" ),"-") as Lembur
  FROM tgl c WHERE c.tanggal between "` +
    req.params.tglin +
    `" and "` +
    req.params.tglout +
    `" ORDER BY c.Tanggal ASC`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        TRIAL VALIDATION API                    ////////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//menampilkan detail Laporan  data scan berdasarkan TANGGAL SCAN

app.get("/api/laporan/:id", (req, res) => {
  conn.query(
    `CALL MenampilkanScan('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;

      let scan = rows[0];

      let strDatangID = ""; // 1,2,3
      let newArray = {};
      scan.map(function (data, key) {
        strDatangID += data.DatangID;
        data["detail"] = [];
        newArray[data.TanggalScan] = data;
        if (key < scan.length - 1) strDatangID += ",";
      });

      let sql =
        `SELECT *,  
        IF(JamKembali IS NULL, DATE_FORMAT(JamKeluar, "%H:%i"), CONCAT(DATE_FORMAT(JamKeluar, "%H:%i"),' - ', DATE_FORMAT(JamKembali, "%H:%i"))) AS KelKan, 
        CONCAT('Total = ',IF(JamKembali IS NULL, '', DATE_FORMAT(TIMEDIFF(JamKembali,JamKeluar), "%H:%i"))) AS Durasi , 
        CONCAT('Ket. : ',IFNULL(Keterangan,'')) AS Ket, 
        CONCAT('Ket. Kembali : ',IFNULL(KeteranganKembali,'')) AS KetKembali 
 
        FROM tblkeluarkantor WHERE DatangID IN(` +
        strDatangID +
        `) `;
      let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        results.map(function (data, key) {
          data["k"] = "Keluar Kantor";
          newArray[data.TanggalScan]["detail"].push(data);
        });
        //console.log(newArray['105']);
        //res.send(JSON.stringify(results));
        res.send(newArray);
      });

      // console.log("SELECT * FROM tblkeluarkantor WHERE DatangID IN('"+strDatangID+"') ");
      /*conn.query() => {

      } 
        function (err, rows){

          if(err) throw err;
          let details = rows[0];

          details.map(function(data, key){
            scan[data.DatangID]['detail'] = [$data]; 
          });
          console.log(scan);
          res.send(scan);
        }*/
    }
  );
});

////////////////////////////////////////////////////////////////////

/////////////            LAPORAN PERTANGGAL       //////////////////

///////////////////////////////////////////////////////////////////

app.get("/api/laporandetail/:id&:TglAwal&:TglAkhir", (req, res) => {
  conn.query(
    `CALL LaporanPertanggal ('` +
    req.params.id +
    `','` +
    req.params.TglAwal +
    `','` +
    req.params.TglAkhir +
    `')`,
    function (err, rows) {
      if (err) throw err;

      let scan = rows[0];

      let strDatangID = ""; // 1,2,3
      let newArray = {};
      scan.map(function (data, key) {
        strDatangID += data.DatangID;
        data["detail"] = [];
        newArray[data.TanggalScan] = data;
        if (key < scan.length - 1) strDatangID += ",";
      });

      let sql =
        `SELECT *,  
        IF(JamKembali IS NULL, DATE_FORMAT(JamKeluar, "%H:%i"), CONCAT(DATE_FORMAT(JamKeluar, "%H:%i"),' - ', DATE_FORMAT(JamKembali, "%H:%i"))) AS KelKan, 
        CONCAT('Total = ',IF(JamKembali IS NULL, '', DATE_FORMAT(TIMEDIFF(JamKembali,JamKeluar), "%H:%i"))) AS Durasi , 
        CONCAT('Ket. : ',IFNULL(Keterangan,'')) AS Ket, 
        CONCAT('Ket. Kembali : ',IFNULL(KeteranganKembali,'')) AS KetKembali 
 
        FROM tblkeluarkantor WHERE DatangID IN(` +
        strDatangID +
        `) `;
      let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        results.map(function (data, key) {
          data["k"] = "Keluar Kantor";
          newArray[data.TanggalScan]["detail"].push(data);
        });
        //console.log(newArray['105']);
        //res.send(JSON.stringify(results));
        res.send(newArray);
      });

      // console.log("SELECT * FROM tblkeluarkantor WHERE DatangID IN('"+strDatangID+"') ");
      /*conn.query() => {

      } 
        function (err, rows){

          if(err) throw err;
          let details = rows[0];

          details.map(function(data, key){
            scan[data.DatangID]['detail'] = [$data]; 
          });
          console.log(scan);
          res.send(scan);
        }*/
    }
  );
});
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
app.get("/api/laporandetail/:id&:TglAwal&:TglAkhir", (req, res) => {
  conn.query(
    `CALL LaporanPertanggal ('` +
    req.params.id +
    `','` +
    req.params.TglAwal +
    `','` +
    req.params.TglAkhir +
    `')`,
    function (err, rows) {
      if (err) throw err;

      let scan = rows[0];

      let strDatangID = ""; // 1,2,3
      let newArray = {};
      scan.map(function (data, key) {
        strDatangID += data.DatangID;
        data["detail"] = [];
        newArray[data.TanggalScan] = data;
        if (key < scan.length - 1) strDatangID += ",";
      });

      let sql =
        `SELECT *,  
        IF(JamKembali IS NULL, DATE_FORMAT(JamKeluar, "%H:%i"), CONCAT(DATE_FORMAT(JamKeluar, "%H:%i"),' - ', DATE_FORMAT(JamKembali, "%H:%i"))) AS KelKan, 
        CONCAT('Total = ',IF(JamKembali IS NULL, '', DATE_FORMAT(TIMEDIFF(JamKembali,JamKeluar), "%H:%i"))) AS Durasi , 
        CONCAT('Ket. : ',IFNULL(Keterangan,'')) AS Ket, 
        CONCAT('Ket. Kembali : ',IFNULL(KeteranganKembali,'')) AS KetKembali 
 
        FROM tblkeluarkantor WHERE DatangID IN(` +
        strDatangID +
        `) `;
      let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        results.map(function (data, key) {
          data["k"] = "Keluar Kantor";
          newArray[data.TanggalScan]["detail"].push(data);
        });
        //console.log(newArray['105']);
        //res.send(JSON.stringify(results));
        res.send(newArray);
      });

      // console.log("SELECT * FROM tblkeluarkantor WHERE DatangID IN('"+strDatangID+"') ");
      /*conn.query() => {

      } 
        function (err, rows){

          if(err) throw err;
          let details = rows[0];

          details.map(function(data, key){
            scan[data.DatangID]['detail'] = [$data]; 
          });
          console.log(scan);
          res.send(scan);
        }*/
    }
  );
});app.get("/api/laporandetail2/:id", (req, res) => {
  conn.query(
    `CALL MenampilkanScan('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;

      let scan = rows[0];

      let strDatangID = ""; // 1,2,3
      let newArray = {};
      scan.map(function (data, key) {
        strDatangID += data.DatangID;
        data["detail"] = [];
        newArray[data.TanggalScan] = data;
        if (key < scan.length - 1) strDatangID += ",";
      });

      let sql =
        `SELECT *,  
        IF(JamKembali IS NULL, DATE_FORMAT(JamKeluar, "%H:%i"), CONCAT(DATE_FORMAT(JamKeluar, "%H:%i"),' - ', DATE_FORMAT(JamKembali, "%H:%i"))) AS KelKan, 
        CONCAT('Total = ',IF(JamKembali IS NULL, '', DATE_FORMAT(TIMEDIFF(JamKembali,JamKeluar), "%H:%i"))) AS Durasi , 
        CONCAT('Ket. : ',IFNULL(Keterangan,'')) AS Ket, 
        CONCAT('Ket. Kembali : ',IFNULL(KeteranganKembali,'')) AS KetKembali 
 
        FROM tblkeluarkantor WHERE DatangID IN(` +
        strDatangID +
        `) `;
      let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        results.map(function (data, key) {
          data["k"] = "Keluar Kantor";
          newArray[data.TanggalScan]["detail"].push(data);
        });
        //console.log(newArray['105']);
        //res.send(JSON.stringify(results));
        res.send(newArray);
      });

      // console.log("SELECT * FROM tblkeluarkantor WHERE DatangID IN('"+strDatangID+"') ");
      /*conn.query() => {

      } 
        function (err, rows){

          if(err) throw err;
          let details = rows[0];

          details.map(function(data, key){
            scan[data.DatangID]['detail'] = [$data]; 
          });
          console.log(scan);
          res.send(scan);
        }*/
    }
  );
});


///////////////////////////////////////////////////////////

///////////                                         ///////

///////////////////////////////////////////////////////////

//menampilkan detail Laporan  data scan berdasarkan User ID

app.get("/api/laporan2/:id", (req, res) => {
  conn.query(
    `CALL MenampilkanScan('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;

      let scan = rows[0];

      let strDatangID = ""; // 1,2,3
      let newArray = {};
      scan.map(function (data, key) {
        strDatangID += data.DatangID;
        data["detail"] = [];
        newArray[data.DatangID] = data;
        if (key < scan.length - 1) strDatangID += ",";
      });

      let sql =
        `SELECT *,  
        IF(JamKembali IS NULL, DATE_FORMAT(JamKeluar, "%H:%i"), CONCAT(DATE_FORMAT(JamKeluar, "%H:%i"),' - ', DATE_FORMAT(JamKembali, "%H:%i"))) AS KelKan, 
        CONCAT('Total = ',IF(JamKembali IS NULL, '', DATE_FORMAT(TIMEDIFF(JamKembali,JamKeluar), "%H:%i"))) AS Durasi , 
        CONCAT('Ket. : ',IFNULL(Keterangan,'')) AS Ket, 
        CONCAT('Ket. Kembali : ',IFNULL(KeteranganKembali,'')) AS KetKembali 
 
        FROM tblkeluarkantor WHERE DatangID IN(` +
        strDatangID +
        `) `;
      let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        results.map(function (data, key) {
          data["k"] = "Keluar Kantor";
          newArray[data.DatangID]["detail"].push(data);
        });
        //console.log(newArray['105']);
        //res.send(JSON.stringify(results));
        res.send(newArray);
      });

      // console.log("SELECT * FROM tblkeluarkantor WHERE DatangID IN('"+strDatangID+"') ");
      /*conn.query() => {

      } 
        function (err, rows){

          if(err) throw err;
          let details = rows[0];

          details.map(function(data, key){
            scan[data.DatangID]['detail'] = [$data]; 
          });
          console.log(scan);
          res.send(scan);
        }*/
    }
  );
});

//Menampilkan Scan Perhari ini
// Dengan menampilkan Jam Keluar Kantor Karyawan
// Key = User ID


app.get("/api/availkaryawan", (req, res) => {
  conn.query(
    `CALL ListScanPerhari`,
    function (err, rows) {
      if (err) throw err;

      let scan = rows[0];

      let strDatangID = ""; // 1,2,3
      let newArray = {};
      scan.map(function (data, key) {
        strDatangID += data.DatangID;
        data["detail"] = [];
        newArray[data.DatangID] = data;
        if (key < scan.length - 1) strDatangID += ",";
      });

      let sql =
        `SELECT *,  
        IF(JamKembali IS NULL, DATE_FORMAT(JamKeluar, "%H:%i"), CONCAT(DATE_FORMAT(JamKeluar, "%H:%i"),' - ', DATE_FORMAT(JamKembali, "%H:%i"))) AS KelKan, 
        CONCAT('Total = ',IF(JamKembali IS NULL, '', DATE_FORMAT(TIMEDIFF(JamKembali,JamKeluar), "%H:%i"))) AS Durasi , 
        CONCAT('Ket. : ',IFNULL(Keterangan,'')) AS Ket, 
        CONCAT('Ket. Kembali : ',IFNULL(KeteranganKembali,'')) AS KetKembali 
 
        FROM tblkeluarkantor WHERE DatangID IN(` +
        strDatangID +
        `) `;
      let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        results.map(function (data, key) {
          data["k"] = "Keluar Kantor";
          newArray[data.DatangID]["detail"].push(data);
        });
        //console.log(newArray['105']);
        //res.send(JSON.stringify(results));
        res.send(newArray);
      });

      // console.log("SELECT * FROM tblkeluarkantor WHERE DatangID IN('"+strDatangID+"') ");
      /*conn.query() => {

      } 
        function (err, rows){

          if(err) throw err;
          let details = rows[0];

          details.map(function(data, key){
            scan[data.DatangID]['detail'] = [$data]; 
          });
          console.log(scan);
          res.send(scan);
        }*/
    }
  );
});

app.get("/api/lp/:id", (req, res) => {
  conn.query(`CALL getID('` + req.params.id + `')`, function (err, rows) {
    if (err) throw err;
    let scan = rows[0];
    res.send(JSON.stringify(scan));

    // console.log("SELECT * FROM tblkeluarkantor WHERE DatangID IN('"+strDatangID+"') ");
    /*conn.query() => {

      } 
        function (err, rows){

          if(err) throw err;
          let details = rows[0];

          details.map(function(data, key){
            scan[data.DatangID]['detail'] = [$data]; 
          });
          console.log(scan);
          res.send(scan);
        }*/
  });
});

////////////////////////////////////////////////////////////////////////////////////////////

////////////////////          API AMBIL SCAN PERHARI                   ////////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//Menampilkan Seluruh Scan Karyawan yang sudah scan Dalam Hari itu

//Urut Berdasarkan Jam Scan (atas)

app.get("/api/listscanperhari", (req, res) => {
  conn.query(`CALL ListScanPerhari `, function (err, rows) {
    if (err) throw err;
    let scan = rows[0];
    res.send(scan);
  });
});

//Urut Berdasarkan Nama (bawah)

app.get("/api/listscanperharinama", (req, res) => {
  conn.query(`CALL ListScanPerhariNama `, function (err, rows) {
    if (err) throw err;
    let scan = rows[0];
    res.send(scan);
  });
});

/////////////////////////////////////////

app.get("/api/applaporan/:id", (req, res) => {
  conn.query(
    `CALL AppMenampilkanScan ('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      let scan = rows[0];
      res.send(scan);
    }
  );
});

// Menampilkan Recent Scan Untuk APP Android Berdasarkan Tgl Mulai Dan Tgl Akhir
app.get("/api/apprecentscan/:id&:TglAwal&:TglAkhir", (req, res) => {
  conn.query(
    `CALL AppMenampilkanRecentScan ('` +
    req.params.id +
    `','` +
    req.params.TglAwal +
    `','` +
    req.params.TglAkhir +
    `')`,
    function (err, rows) {
      if (err) throw err;
      let scan = rows[0];
      res.send(scan);
    }
  );
});

app.get("/api/tlaporan", (req, res) => {
  conn.query(
    `CALL MenampilkanLaporan ('` +
    req.body.Nama +
    `','` +
    req.body.TglAwal +
    `','` +
    req.body.TglAkhir +
    `')`,
    function (err, rows) {
      if (err) throw err;
      let scan = rows[0];
      res.send(scan);
    }
  );
});

app.delete("/api/deletescan", (req, res) => {
  let sql = `DELETE FROM attlog ORDER BY DatangID DESC LIMIT 1`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

app.delete("/api/del/:id", (req, res) => {
  let sql = `DELETE FROM attlog WHERE UserID="` + req.params.id + `" AND TanggalScan = CURRENT_DATE()`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});


//////////////////////////////////////////////////////////////////////

// API Temporari Izin

/////////////////////////////////////////////////////////////////////


// Menampilkan Seluruh Request Izin yang Pertama
app.get("/api/reqizin", (req, res) => {
  conn.query(`CALL MenampilkanReqIzin `, function (err, rows) {
    if (err) throw err;
    let izin = rows[0];
    res.send(izin);
  });
});

// Menampilkan Izin Yang DI Acc Orang 1 
app.get("/api/reqizinlv1", (req, res) => {
  conn.query(`CALL MReqIzinAccPertama`, function (err, rows) {
    if (err) throw err;
    let izin = rows[0];
    res.send(izin);
  });
});


// Menampilkan Izin yang di acc 
app.get("/api/accizin", (req, res) => {
  conn.query(`CALL MenampilkanAccIzin`, function (err, rows) {
    if (err) throw err;
    let izin = rows[0];
    res.send(izin);
  });
});


// Proses Request Izin Karyawan 
//Menambahkan Data Request Izin
app.post("/api/reqizin", (req, res) => {
  let sql =
    `CALL ProsesReqIzin (
'` +
    req.body.UserID +
    `',
'` +
    req.body.Tanggal +
    `',
'` +
    req.body.Status +
    `',
'` +
    req.body.Keterangan +
    `'  
)`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});


//Proses Acc User Pertama
app.put("/api/reqizinlv1/:id", (req, res) => {
  let data = {
    UserID: req.body.UserID,
    yn1: req.body.yn1,
    Alasan: req.body.Alasan,
  };
  let sql =
    `UPDATE cabang SET ACC3="` +
    req.body.UserID +
    `", YN1="` +
    req.body.yn1 +
    `", Alasan="` +
    req.body.Alasan +
    `" WHERE IzinID="` +
    req.params.id +
    `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Proses Acc User kedua
app.put("/api/reqizinlv2/:id", (req, res) => {
  let data = {
    UserID: req.body.UserID,
    yn2: req.body.yn2,
    Alasan: req.body.Alasan,
  };
  let sql =
    `UPDATE cabang SET ACC3="` +
    req.body.UserID +
    `", YN2="` +
    req.body.yn2 +
    `", Alasan="` +
    req.body.Alasan +
    `" WHERE IzinID="` +
    req.params.id +
    `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

/////////////////////////////////////////

///////////  API Option
//////////////////////////////////////

///////////// API OPTION USER /////////
app.get("/api/optuser", (req, res) => {
  conn.query(`CALL optUser`, function (err, rows) {
    if (err) throw err;
    let user = rows[0];
    res.send(user);
  });
});


///////////// API OPTION USER /////////
app.get("/api/optusermanual", (req, res) => {
  conn.query(`CALL optUserMasukManual`, function (err, rows) {
    if (err) throw err;
    let user = rows[0];
    res.send(user);
  });
});

///////////// API OPTION USER /////////
app.get("/api/optusermanualpulang", (req, res) => {
  conn.query(`CALL optUserPulangManual`, function (err, rows) {
    if (err) throw err;
    let user = rows[0];
    res.send(user);
  });
});

///////////// API OPTION USER /////////
app.get("/api/optusermanualkeluar", (req, res) => {
  conn.query(`CALL optUserKeluarManual`, function (err, rows) {
    if (err) throw err;
    let user = rows[0];
    res.send(user);
  });
});

///////////// API OPTION USER /////////
app.get("/api/optusermanualkembali", (req, res) => {
  conn.query(`CALL optUserKembaliManual`, function (err, rows) {
    if (err) throw err;
    let user = rows[0];
    res.send(user);
  });
});

///////////// API OPTION USER /////////
app.get("/api/optusermanualkeluarist", (req, res) => {
  conn.query(`CALL optUserIstirahatKeluarManual`, function (err, rows) {
    if (err) throw err;
    let user = rows[0];
    res.send(user);
  });
});

///////////// API OPTION USER /////////
app.get("/api/optusermanualkembaliist", (req, res) => {
  conn.query(`CALL optUserIstirahatKembaliManual`, function (err, rows) {
    if (err) throw err;
    let user = rows[0];
    res.send(user);
  });
});


///////////// API OPTION GROUP  /////////
app.get("/api/optgroup", (req, res) => {
  conn.query(`CALL optGroup`, function (err, rows) {
    if (err) throw err;
    let group = rows[0];
    res.send(group);
  });
});

///////////// API OPTION GROUP  /////////
app.get("/api/optTerlambat", (req, res) => {
  conn.query(`CALL optTerlambat`, function (err, rows) {
    if (err) throw err;
    let group = rows[0];
    res.send(group);
  });
});




///////////// API OPTION CABANG  /////////
app.get("/api/optcabang", (req, res) => {
  conn.query(`CALL optCabang`, function (err, rows) {
    if (err) throw err;
    let Cabang = rows[0];
    res.send(Cabang);
  });
});


///////////// API ON DUTY /////////
app.get("/api/onduty", (req, res) => {
  conn.query(`CALL OnDutyRoster`, function (err, rows) {
    if (err) throw err;
    let Cabang = rows[0];
    res.send(Cabang);
  });
});

/////////////////////////////////////////////
///////////  API PROSES ABSENSI         ////
///////////////////////////////////////////


// Api untuk proses absensi
/**
 */

app.post("/api/proses", (req, res) => {
  let post = {
    UserID: req.body.UserID,
    TglAwal: req.body.TglAwal,
    TglAkhir: req.body.TglAkhir,
  };
  // Mendapatkan Tanggal Yang Kosong 

  let sql2 = `
    SELECT Tanggal 
    FROM tmptanggal 
    WHERE 
      Tanggal NOT IN (
        SELECT TanggalScan 
        FROM attlog 
        WHERE UserID ="`+post.UserID+`"
        AND TanggalScan BETWEEN "`+post.TglAwal+`" AND "`+post.TglAkhir+`" -- 2021-03-24 Ali: saya tambah line ini agar mempercepat query kalau data sudah besar nantinya.
      ) 
      AND Tanggal BETWEEN "`+post.TglAwal+`" AND "`+post.TglAkhir+`"`;
  let sql3 = `CALL MencariTanggalLupaScanPulang('`+post.UserID+`','`+post.TglAwal+`','`+post.TglAkhir+`')`;
  // query = mysql.format(query, table);

  conn.query(sql2, function (error, rows) {
    if (error) {
      console.log(error);
    } else { 
      var i;
      for (i = 0; i < rows.length; i++)
      { 
        conn.query(`CALL ProsesAbsensi('`+post.UserID+`','`+moment.parseZone(rows[i].Tanggal).format('YYYY-MM-DD')+`')`); 
      }
        
      conn.query(sql3, function (error, rows) {
        if (error) {
          console.log(error);
        } else { 
          var i;
          for (i = 0; i < rows.length; i++)
          { 
            conn.query(`CALL ProsesAbsensiLupaScanPulang('`+post.UserID+`','`+moment.parseZone(rows[i].TanggalScan).format('YYYY-MM-DD')+`')`); 
          }
          res.json({ Message: "OK",rows});
        };
      });
    };
  });

});


// Upload File

// menerapkan middleware multer hanya pada rute berikut
app.post("/api/upload",multer({ storage: diskStorage }).single("photo"),
  (req, res) => {
    const file = req.file.path;
    const filename = req.file.filename;
    console.log(file);
    console.log(filename);
    var sql = "INSERT INTO test (path1) VALUES('"+filename+"')"
    var sql2 = "SELECT keyf FROM test ORDER BY keyf DESC limit 1"
    if (!file) {
      res.status(400).send({
        status: false,
        data: "No File is selected.",
      });
    } else {
      conn.query(sql, function (err,results) {
        if (err) throw err;
        else{
        conn.query(sql2, function (err,rows) {
          keyf = rows[0];
          if (err) throw err;
          res.send(keyf);
        });}
      });
      //res.send(file);
    }
      // var sql = "INSERT INTO test VALUES('"+req.file.filename+"')";
      //conn.query(sql, function(err, results){

   //  })
    
  }
);



// menerapkan middleware multer hanya pada rute berikut
app.put("/api/upload",multer({ storage: diskStorage }).single("photo"),
  (req, res) => {
    const file = req.file.path;
    const filename = req.file.filename;
    var sql = "UPDATE SET test (path2) VALUES('"+filename+"')"
    if (!file) {
      res.status(400).send({
        status: false,
        data: "No File is selected.",
      });
    } else {
      conn.query(sql, function (err,results) {
        if (err) throw err;
        res.send(results);
      });
      //res.send(file);
    }
      // var sql = "INSERT INTO test VALUES('"+req.file.filename+"')";
      //conn.query(sql, function(err, results){

   //  })
    
  }
);


  ///////////////////////////////////////////////////////
 ////////           API PENGUMUMAN           //////////
/////////////////////////////////////////////////////


app.get("/api/pengumuman", (req, res) => {
  conn.query(`SELECT *FROM news`, function (err, rows) {
    if (err) throw err;
    let news = rows;
    res.send(news);
  });
});

// app.post("/api/pengumuman", (req, res) => {
//   var Data = {
//       kode = req.body.kode,
//       judul = req.body.judul,
//       isi = req.body.isi,
//       tgl_posting = req.body.tgl_posting,
//       user_posting = req.body.user_posting,
//       StartDate= req.body.StartDate,
//       EndDate= req.body.EndDate,
//       aktif= req.body.aktif,
//       group= req.body.group,
//   };
//   conn.query(`INSERT INTO news(kode,judul,isi,tgl_posting,user_posting,StartDate,EndDate,aktif,group) VALUES (data.kode,data.judul,isi,tgl_posting,user_posting,StartDate,EndDate,aktif,group)`, function (err, rows) {
//     if (err) throw err;
//     let news = rows;
//     res.send(news);
//   });
// });

////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        API BERHUBUNGAN SUPER ADMIN        ///////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//Menampilkan seluruh data cabang yang sudah terdaftar di panel admin
app.get("/api/superadmin", (req, res) => {
  let sql = `SELECT AdminID,  DATE_FORMAT(TanggalCreate, "%d-%m-%Y") as TanggalCreate FROM admin WHERE RoleAdmin ='1'`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Menampilkan detai data cabang yang sudah terdaftar di panel admin
app.get("/api/superadmin/:id", (req, res) => {
  conn.query(
    `SELECT AdminID,Password, DATE_FORMAT(TanggalCreate, "%Y-%m-%d") as TanggalCreate FROM admin Where AdminID="`+ req.params.id +`"`,
    function (err, rows) {
      if (err) throw err;
      let cabang = rows[0];
      res.send(cabang);
    }
  );
});

//Menambahkan Data Cabang dengan kode cabang dan nama cabang
app.post("/api/superadmin", (req, res) => {
  let data = {
    AdminID: req.body.AdminID,
    Password: md5(req.body.Password),
    RoleAdmin : "1",
    TanggalCreate : moment.parseZone(moment()).format('YYYY-MM-DD'),
  };
  let sql = "INSERT INTO admin SET ?";
  let query = conn.query(sql, data, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Mengedit Nama Cabang untuk untuk panel admin
app.put("/api/superadmin/:id", (req, res) => {
  let data = {
    AdminID: req.body.AdminID,
    Password: md5(req.body.Password),
  };
  let sql =
    `UPDATE admin SET Password="` +
    data.Password +
    `" WHERE AdminID="` +
    req.params.id +
    `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Menghapus data cabang untuk panel admin
app.delete("/api/superadmin/:id", (req, res) => {
  let sql = `DELETE FROM admin WHERE AdminID="` + req.params.id + `"`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

/////////////////////////////////////////////
///////////  API IZIN GROUP        ////
///////////////////////////////////////////


// Api untuk proses absensi
app.post("/api/pilihizin", (req, res) => {
  let Body = {
    TanggalScan: req.body.TanggalScan,
    Status: req.body.Status,
    Keterangan : req.body.Keterangan,
  };

  let ArrayID = req.body.Nama ; 
  console.log(ArrayID);
  // Mendapatkan Tanggal Yang Kosong 

  let sql2 = `SELECT Now() as Waktu`

 // query = mysql.format(query, table);

  conn.query(sql2, function (error, rows) {
    if (error) {
      console.log(error);
    } else { 
        var i;
        for (i = 0; i < ArrayID.length; i++)
        { conn.query(`CALL InputIzinPerorang('`+ArrayID[i].value+`','`+Body.TanggalScan+`','`+Body.Status+`','`+Body.Keterangan+`')`); }
        res.json({ Message: "OK",rows});
  };
});

});




//Server listening
app.listen(3001, () => {
  console.log("Server started on port 3001...");
});
