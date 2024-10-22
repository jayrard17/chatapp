const socket = io('http://localhost:3000');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const imageViewer = document.getElementById('image-viewer');
const fullsizeImage = document.getElementById('fullsize-image');
const exitIcon = document.getElementById('exit-icon');
const signoutButton = document.getElementById('signout-button');

let username; // Variable to hold the user's name

// Fetch the username from the server
fetch('/check-auth')
    .then(response => {
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        return response.json();
    })
    .then(data => {
        username = data.username;
        appendMessage('You joined', username);
        socket.emit('new-user', username);
    })
    .catch(error => {
        console.error(error);
        window.location.href = 'login.html'; // Redirect to login if not authenticated
    });

//  incoming chat messages
socket.on('chat-message', data => {
    appendMessage(data.name, data.message);
});

//  incoming file messages
socket.on('file-message', data => {
    appendFileMessage(data.name, data.filename, data.data, data.fileType);
});

//  user connection events
socket.on('user-connected', name => {
    appendMessage(`${name} has joined the chat`, name);
});

//  user disconnection events
socket.on('user-disconnected', name => {
    appendMessage(`${name} has left the chat`, name);
});

messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value.trim(); // trim any whitespace

    if (message) { 
        socket.emit('send-chat-message', { name: username, message: message });
        appendMessage('You', message); 
        messageInput.value = ''; 
    }
});

//Handle file input change
fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const fileData = event.target.result;
            socket.emit('send-file', { name: username, filename: file.name, data: fileData, fileType: file.type });
            appendFileMessage('You', file.name, fileData, file.type); 
        };
        reader.readAsDataURL(file); 
    }
});

// append messages to the chat
function appendMessage(userName, message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerText = `${userName}: ${message}`; 
    messageContainer.append(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

//  append file messages to the chat
function appendFileMessage(name, filename, fileData, fileType) {
    const messageElement = document.createElement('div');
    messageElement.className = 'file-message';
    
    if (fileType.startsWith('image/')) {
        messageElement.innerHTML = 
            `<p>${name} shared an image:</p>
            <img src="${fileData}" alt="${filename}" style="max-width: 100%; max-height: 300px; object-fit: contain;">`;
        const imgElement = messageElement.querySelector('img');
        imgElement.addEventListener('click', () => showFullsizeImage(fileData));
    } else {
        messageElement.innerHTML = `${name} shared a file: <a href="${fileData}" target="_blank">${filename}</a>`;
    }
    
    messageContainer.append(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

//  show fullsize image
function showFullsizeImage(src) {
    fullsizeImage.src = src;
    imageViewer.style.display = 'flex';
}

// exit icon
exitIcon.addEventListener('click', () => {
    imageViewer.style.display = 'none';
});

// event listener to close image viewer when clicking outside the image
imageViewer.addEventListener('click', (e) => {
    if (e.target === imageViewer) {
        imageViewer.style.display = 'none';
    }
});

// sign-out button function
signoutButton.addEventListener('click', () => {
    // disconnect from the socket
    socket.disconnect();
    
    // redirect to login page onced clicked
    window.location.href = 'login.html';
});
