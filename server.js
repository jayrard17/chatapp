const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = {};

io.on('connection', socket => {
    socket.on('new-user', name => {
        users[socket.id] = name;
        socket.broadcast.emit('user-connected', name);
    });
    socket.on('send-chat-message', message => {
        socket.broadcast.emit('chat-message', { message: message, name: users[socket.id] });
    });
    socket.on('send-file', (fileData) => {
        const filename = path.join(__dirname, 'uploads', fileData.filename);
        fs.writeFile(filename, Buffer.from(fileData.data), (err) => {
            if (err) {
                console.error('Error saving file:', err);
            } else {
                const fileUrl = `/uploads/${fileData.filename}`;
                socket.broadcast.emit('file-message', { 
                    name: users[socket.id], 
                    filename: fileData.filename, 
                    fileUrl: fileUrl,
                    fileType: fileData.fileType
                });
            }
        });
    });
    socket.on('disconnect', () => {
        socket.broadcast.emit('user-disconnected', users[socket.id]);
        delete users[socket.id];
    });
});

// Serve static files from the public directory
app.use(express.static('public'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Start the server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}