const { neon } = require('@netlify/neon')
const { promisify } = require('util');
const sql = neon();

await sql`CREATE TABLE IF NOT EXISTS users (uuid TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, displayName TEXT, color TEXT)`;

module.exports = {
  addUser: (username, password) => new Promise(async (resolve, reject) => {
    const uuid = require('crypto').randomUUID();
    try {
      
      await sql`INSERT INTO users (uuid,username,password) VALUES (${uuid},${username},${password})`;
    } catch (err) {
      reject(err);
    }

    resolve(uuid);
  }),
  getUser: username => new Promise(async (res, rej) => {
    try {
      var row = await sql`SELECT * FROM users WHERE username=${username}`;
    } catch (err) {
      rej(err);
    }

    res(row);
  }),
  getUserFromUUID: uuid => new Promise(async (res, rej) => {
    try {
      var row = await sql`SELECT * FROM users WHERE uuid=${uuid}`;
    } catch (err) {
      rej(err);
    }

    res(row);
  }),
  updateUser: (uuid, fields) => new Promise((resolve,reject)=>{
    db.run(`UPDATE users SET displayName=?,color=? WHERE uuid=?`, [fields.displayName, fields.color, uuid], err => err?reject(err):resolve());
  })
};