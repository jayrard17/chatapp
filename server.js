const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = {};

// parsing JSON bodies
app.use(bodyParser.json());
app.use(express.static('public')); 
app.use('/uploads', express.static('uploads')); 

app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // set to upload files to 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); 
    }
});
const upload = multer({ storage }); 

// database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chatapp'
});

// connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

//  user registration
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10); //hash
        //insert the user data into the database
        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(query, [name, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting user into the database:', err);
                return res.status(500).send('Error registering user.');
            }
            res.status(200).send('User registered successfully!');
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Error registering user.');
    }
});

// user login verification
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error fetching user from the database:', err);
            return res.status(500).send('Error logging in.');
        }

        if (results.length === 0) {
            return res.status(400).send('User not found.');
        }

        const user = results[0];

        // compare of hashed password with the entered password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).send('Incorrect password.');
        }

        // store user info in session
        req.session.userId = user.id;
        req.session.username = user.name; // store username

        res.status(200).json({ message: 'Login successful!', username: user.name }); 
    });
});

// check authentication
app.get('/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ username: req.session.username });
    } else {
        res.sendStatus(401); // unauthorized
    }
});

// the chat route
app.get('/index.html', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.redirect('/login.html');
    }
});

// socket connections
io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('new-user', (name) => {
        users[socket.id] = name;
        socket.broadcast.emit('user-connected', name);
    });

    socket.on('send-chat-message', (data) => {
        socket.broadcast.emit('chat-message', data);
    });

    //  file upload event
    socket.on('send-file', (data) => {
        //   buffer from the data
        const buffer = Buffer.from(data.data.split(",")[1], 'base64'); // extract base64 data
        const filePath = path.join(__dirname, 'uploads', data.filename); // create file path

        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                console.error('Error saving file:', err);
                return;
            }
            console.log(`File saved: ${data.filename}`);
            socket.broadcast.emit('file-message', {
                name: data.name,
                filename: data.filename,
                data: `/uploads/${data.filename}`, 
                fileType: data.fileType
            });
        });
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('user-disconnected', users[socket.id]);
        delete users[socket.id];
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
