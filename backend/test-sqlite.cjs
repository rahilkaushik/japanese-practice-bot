const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, val TEXT)');
db.prepare('INSERT INTO test VALUES (1, ?)').run('hello');
const rows = db.prepare('SELECT * FROM test').all();
console.log('node:sqlite OK:', JSON.stringify(rows));
