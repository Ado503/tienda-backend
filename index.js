require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  dateStrings: true, // la fecha llega como YYYY-MM-DD
  waitForConnections: true,
  connectionLimit: 10
});

// error 500, o mensaje, o los datos
const responder = (res, mensaje) => (err, r) => {
  if (err) return res.status(500).send(err);
  res.json(mensaje ? { message: mensaje } : r);
};

// ---------- CLIENTES ----------
app.get('/clientes', (req, res) => {
  conexion.query('SELECT * FROM clientes', responder(res));
});
app.post('/clientes', (req, res) => {
  const { nombre, correo } = req.body;
  conexion.query('INSERT INTO clientes (nombre, correo) VALUES (?, ?)',
    [nombre, correo], responder(res, 'Cliente agregado'));
});
app.put('/clientes/:id', (req, res) => {
  const { nombre, correo } = req.body;
  conexion.query('UPDATE clientes SET nombre=?, correo=? WHERE id=?',
    [nombre, correo, req.params.id], responder(res, 'Cliente actualizado'));
});
app.delete('/clientes/:id', (req, res) => {
  conexion.query('DELETE FROM clientes WHERE id=?',
    [req.params.id], responder(res, 'Cliente eliminado'));
});

// ---------- JUEGOS ----------
app.get('/juegos', (req, res) => {
  conexion.query('SELECT * FROM juegos', responder(res));
});
app.post('/juegos', (req, res) => {
  const { nombre, plataforma, precio } = req.body;
  conexion.query('INSERT INTO juegos (nombre, plataforma, precio) VALUES (?, ?, ?)',
    [nombre, plataforma, precio], responder(res, 'Juego agregado'));
});
app.put('/juegos/:id', (req, res) => {
  const { nombre, plataforma, precio } = req.body;
  conexion.query('UPDATE juegos SET nombre=?, plataforma=?, precio=? WHERE id=?',
    [nombre, plataforma, precio, req.params.id], responder(res, 'Juego actualizado'));
});
app.delete('/juegos/:id', (req, res) => {
  conexion.query('DELETE FROM juegos WHERE id=?',
    [req.params.id], responder(res, 'Juego eliminado'));
});

// ---------- COMPRAS (JOIN múltiple) ----------
app.get('/compras', (req, res) => {
  const sql = `
    SELECT c.id, cl.nombre AS cliente, j.nombre AS juego, j.plataforma,
           c.cantidad, c.fecha, j.precio, (c.cantidad * j.precio) AS total,
           c.cliente_id, c.juego_id
    FROM compras c
    INNER JOIN clientes cl ON c.cliente_id = cl.id
    INNER JOIN juegos j ON c.juego_id = j.id
  `;
  conexion.query(sql, responder(res));
});
app.post('/compras', (req, res) => {
  const { cliente_id, juego_id, cantidad, fecha } = req.body;
  conexion.query(
    'INSERT INTO compras (cliente_id, juego_id, cantidad, fecha) VALUES (?, ?, ?, ?)',
    [cliente_id, juego_id, cantidad, fecha],
    responder(res, 'Compra registrada correctamente'));
});
app.put('/compras/:id', (req, res) => {
  const id = req.params.id;
  const { cliente_id, juego_id, cantidad, fecha } = req.body;
  conexion.query(
    'UPDATE compras SET cliente_id=?, juego_id=?, cantidad=?, fecha=? WHERE id=?',
    [cliente_id, juego_id, cantidad, fecha, id],
    responder(res, `Compra con ID ${id} actualizada`));
});
app.delete('/compras/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM compras WHERE id=?', [id],
    responder(res, `Compra con ID ${id} eliminada`));
});

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en puerto ${PORT}`);
});