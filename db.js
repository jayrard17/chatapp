const mysql = require('mysql2');

// create connection to the MySQL server
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
});

// create the database and a table for users
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL.');

    // create a new database
    connection.query('CREATE DATABASE IF NOT EXISTS chatapp', (err, result) => {
        if (err) throw err;
        console.log('Database created or exists already.');

        //  created database
        connection.query('USE chatapp', (err, result) => {
            if (err) throw err;
            console.log('Using chatapp database.');

            //  "users" table
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL
                )`;

            connection.query(createUsersTable, (err, result) => {
                if (err) throw err;
                console.log('Users table created or exists already.'); //table created or exist
                connection.end(); 
            });
        });
    });
});
