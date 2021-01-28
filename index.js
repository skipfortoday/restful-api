const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const mysql = require("mysql");
const {
  request
} = require("express");
var session = require("express-session");
var pdf = require("pdfkit"); //to create PDF using NODE JS
var fs = require("fs"); // to create write streams
var myDoc = new pdf();

// parse application/json

app.use(cors());
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

//create database connection
const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "absensi",
  timezone: "utc",
});

const conn2 = mysql.createConnection({
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
          Message: "UserID atau Pass salah!"
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
      var datang = rows[0];
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

//GET Data KeluarID untuk karyawan yang sama sesuai datang id dan validasi
// untuk prosesi validasi scan balik kantor  karyawan

app.get("/api/keluarkantor/:id", (req, res) => {
  conn.query(
    `CALL MengambilKeluarID ('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      var datang = rows[0];
      res.send(datang);
    }
  );
});

//Put data untuk update scan pulang setelah mendapatkan DatangID

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
    req.body.Keterangan +
    `'
    )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify());
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////        API BERHUBUNGAN DENGAN DATA USER         ////////////////////

///////////////////////////////////////////////////////////////////////////////////////////

//Menampilkan Seluruh List User untuk table data karyawan di web admin
app.get("/api/user", (req, res) => {
  let sql = `SELECT a.UserID, a.Nama, c.Jabatan, DATE_FORMAT(a.TglMulaiCuti, "%d-%m-%Y") as TglMulaiCuti
  FROM user a JOIN tblgrupjabatan c ON a.GroupID = c.GroupID  `;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//menampilkan detail user  data  berdasarkan User ID
app.get("/api/user/:id", (req, res) => {
  conn.query(
    `CALL MenampilkanDetailUser('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      var user = rows[0];
      var detailuser = user[0];
      res.send(detailuser);
    }
  );
});

//Tambahkan data user untuk panel admin
app.post("/api/user", (req, res) => {
  let data = {
    Nama: req.body.Nama,
    UserID: req.body.UserID,
  };
  
  let sql =
    `CALL MenambahUser (
  '` +
    req.body.UserID +
    `',
  '` +
    req.body.Pass +
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
    req.body.TampilkanTerlambat +
    `'
  )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});

//Mengedit data user untuk panel admin
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
    req.body.Pass +
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
    req.body.TampilkanTerlambat +
    `'
    )`;
  let query = conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(data));
  });
});



///////// TRIALLL

//Menampilkan Detail grup Per ID Pegawai
app.get("/api/usertest/:id", (req, res) => {
  conn.query(
    `SELECT * FROM user Where UserID="` + req.params.id + `"`,
    function (err, rows) {
      if (err) throw err;
      var group = rows[0];
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
      var group = rows[0];
      res.send(group);
    }
  );
});

//Tambahkan data GROUP untuk panel admin
app.post("/api/group", (req, res) => {
  let data = {
    GroupID: req.body.GroupID,
    jabatan: req.body.Jabatan,
    JamDatang: req.body.JamDatang,
    MaxJamDatang: req.body.MaxJamDatang,
    JamPulang: req.body.JamPulang,
    MinJamLembur: req.body.MinJamLembur,
    RpPotonganTerlambat: req.body.RpPotonganTerlambat,
    JamDatangSiang: req.body.JamDatangSiang,
    MaxJamDatangSiang: req.body.MaxJamDatangSiang,
    MinJamLemburSiang: req.body.MinJamLemburSiang,
    HariLibur: req.body.HariLibur,
    RpPotonganTerlambat: req.body.RpPotonganTerlambat,
    RpPotonganTidakMasuk: req.body.RpPotonganTidakMasuk,
    RpLemburPerJam: req.body.RpLemburPerJam,
    JamDatangSore: req.body.JamDatangSore,
    MaxJamDatangSore: req.body.MaxJamDatangSore,
    JamPulangSore: req.body.JamPulangSore,
    MinJamLemburSore: req.body.JamLemburSore,
  };

  let sql = "INSERT INTO tblgrupjabatan SET ?";
  let query = conn.query(sql, data, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});

//Mengedit Data GROUP untuk panel admin
app.put("/api/group/:id", (req, res) => {
  let sql =
    `UPDATE tblgrupjabatan SET GroupID="` +
    req.body.GroupID +
    `", Jabatan="` +
    req.body.Jabatan +
    `", JamDatang="` +
    req.body.JamDatang +
    `",JamPulang="` +
    req.body.JamPulang +
    `", MaxJamDatang="` +
    req.body.MaxJamDatang +
    `", MinJamLembur="` +
    req.body.MinJamLembur +
    `", HariLibur="` +
    req.body.HariLibur +
    `", RpPotonganTerlambat="` +
    req.body.RpPotonganTerlambat +
    `", JamDatangSiang="` +
    req.body.JamDatangSiang +
    `",JamPulangSiang="` +
    req.body.JamPulangSiang +
    `", MaxJamDatangSiang="` +
    req.body.MaxJamDatangSiang +
    `", MinJamLemburSiang="` +
    req.body.MinJamLemburSiang +
    `", HariLibur="` +
    req.body.HariLibur +
    `", RpPotonganTerlambat="` +
    req.body.RpPotonganTerlambat +
    `", RpPotonganTidakMasuk="` +
    req.body.RpPotonganTidakMasuk +
    `", RpLemburPerJam="` +
    req.body.RpLemburPerJam +
    `", JamDatangSore="` +
    req.body.JamDatangSore +
    `", MaxJamDatangSore="` +
    req.body.MaxJamDatangSore +
    `", JamPulangSore="` +
    req.body.JamPulangSore +
    `", MinJamLemburSore="` +
    req.body.MinJamLemburSore +
    `" WHERE GroupID="` +
    req.params.id +
    `"`;
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
      var cabang = rows[0];
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
    NamaCabang: req.body.NamaCabang, };
  let sql =
    `UPDATE cabang SET NamaCabang="` +
    req.body.NamaCabang +
    `", Alamat="` +
    req.body.Alamat +
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
  let post = {
    Pass: req.body.Pass,
    UserID: req.body.UserID,
  };
  let query = "Select * FROM ?? WHERE ??=? AND ??=?";
  let table = ["user", "Pass", post.Pass, "UserID", post.UserID];

  query = mysql.format(query, table);
  conn.query(query, function (error, rows) {
    if (error) {
      console.log(error);
    } else {
      if (rows.length == 1) {
        res.json({
          Message: "OK",
        });
      } else {
        res.json({
          Error: true,
          Message: "Username atau Password Salah!"
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
          Message: "UserID atau Pass salah!"
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
  conn.query(
    `CALL MenampilkanIzin`,
    function (err, rows) {
      if (err) throw err;
      var izin = rows[0];
      res.send(izin);
    }
  );
});

//tampilkan data izin yang sudah diterima berdasakan id
app.get("/api/izin/:id", (req, res) => {
  conn.query(
    `CALL MenampilkanDetailIzin('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      var izin = rows[0];
      var detailizin = izin[0];
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
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
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




//menampilkan detail Laporan  data scan berdasarkan User ID

app.get("/api/laporan/:id", (req, res) => {
  conn.query(
    `CALL MenampilkanScan('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      var scan = rows[0];
      res.send(scan);
    }
  );
});

app.get("/api/applaporan/:id", (req, res) => {
  conn.query(
    `CALL AppMenampilkanScan ('` + req.params.id + `')`,
    function (err, rows) {
      if (err) throw err;
      var scan = rows[0];
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







//Server listening
app.listen(3001, () => {
  console.log("Server started on port 3001...");
});