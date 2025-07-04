const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const db = new sqlite3.Database('data/users.db');

db.run(`CREATE TABLE IF NOT EXISTS users (uuid TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, displayName TEXT, color TEXT)`);

module.exports = {
  addUser: (username, password) => new Promise((resolve, reject) => {
    const uuid = require('crypto').randomUUID();
    db.run(`INSERT INTO users (uuid,username,password) VALUES (?,?,?)`, [uuid,username,password], err => err ? reject(err) : resolve(uuid));
  }),
  getUser: username => new Promise((res, rej) => db.get(`SELECT * FROM users WHERE username=?`, [username], (e,row) => e?rej(e):res(row))),
  getUserFromUUID: uuid => new Promise((res, rej) => db.get(`SELECT * FROM users WHERE uuid=?`, [uuid], (e,row) => e?rej(e):res(row))),
  updateUser: (uuid, fields) => new Promise((resolve,reject)=>{
    db.run(`UPDATE users SET displayName=?,color=? WHERE uuid=?`, [fields.displayName, fields.color, uuid], err => err?reject(err):resolve());
  })
};