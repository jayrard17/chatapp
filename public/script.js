const socket = io('http://localhost:3000');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const imageViewer = document.getElementById('image-viewer');
const fullsizeImage = document.getElementById('fullsize-image');
const exitIcon = document.getElementById('exit-icon');
const emojiButton = document.getElementById('emoji-button');
const emojiPicker = document.getElementById('emoji-picker');
const signoutButton = document.getElementById('signout-button');

let firstUser = null; // Variable to track the first user

// Prompt the user for their name
const name = prompt('What is your name?');
if (!firstUser) {
  firstUser = name; // Set the first user
}
appendMessage('You joined', name);
socket.emit('new-user', name);

// Listen for incoming chat messages
socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`, data.name);
});

// Listen for incoming file messages
socket.on('file-message', data => {
  appendFileMessage(data.name, data.filename, data.fileUrl, data.fileType);
});

// Listen for user connection events
socket.on('user-connected', name => {
  appendMessage(`${name} has joined the chat`, name);
});

// Listen for user disconnection events
socket.on('user-disconnected', name => {
  appendMessage(`${name} has left the chat`, name);
});

// Handle message form submission
messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = messageInput.value;
  appendMessage(`You: ${message}`, name);
  socket.emit('send-chat-message', message);
  messageInput.value = ''; // Clear input field after sending
});

// Handle file input change
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const fileData = event.target.result;
      socket.emit('send-file', { filename: file.name, data: fileData, fileType: file.type });
      appendFileMessage('You', file.name, URL.createObjectURL(file), file.type);
    };
    reader.readAsArrayBuffer(file);
  }
});

// Function to append messages to the chat
function appendMessage(message, userName) {
  const messageElement = document.createElement('div');

  // Check if the user is the first user or not
  const isFirstUser = userName === firstUser;
  messageElement.className = isFirstUser ? 'message left' : 'message right'; // Apply different classes

  messageElement.innerText = message;
  messageContainer.append(messageElement);
  
  // Scroll to the bottom of the message container
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Function to append file messages to the chat
function appendFileMessage(name, filename, fileUrl, fileType) {
  const messageElement = document.createElement('div');
  messageElement.className = 'file-message';
  
  if (fileType.startsWith('image/')) {
    messageElement.innerHTML = `
      <p>${name} shared an image:</p>
      <img src="${fileUrl}" alt="${filename}" style="max-width: 100%; max-height: 300px; object-fit: contain;">
    `;
    const imgElement = messageElement.querySelector('img');
    imgElement.addEventListener('click', () => showFullsizeImage(fileUrl));
  } else {
    messageElement.innerHTML = `${name} shared a file: <a href="${fileUrl}" target="_blank">${filename}</a>`;
  }
  
  messageContainer.append(messageElement);
  // Scroll to the bottom of the message container
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Function to show fullsize image
function showFullsizeImage(src) {
  fullsizeImage.src = src;
  imageViewer.style.display = 'flex';
}

// Event listener for exit icon
exitIcon.addEventListener('click', () => {
  imageViewer.style.display = 'none';
});

// Event listener to close image viewer when clicking outside the image
imageViewer.addEventListener('click', (e) => {
  if (e.target === imageViewer) {
    imageViewer.style.display = 'none';
  }
});

// Emoji picker functionality
emojiButton.addEventListener('click', () => {
  emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
});

document.querySelector('emoji-picker').addEventListener('emoji-click', event => {
  messageInput.value += event.detail.unicode;
  emojiPicker.style.display = 'none';
});

// Close emoji picker when clicking outside
document.addEventListener('click', (event) => {
  if (!emojiButton.contains(event.target) && !emojiPicker.contains(event.target)) {
    emojiPicker.style.display = 'none';
  }
});

// Sign-out functionality
signoutButton.addEventListener('click', () => {
  // Disconnect from the socket
  socket.disconnect();
  
  // Clear any stored user data (if applicable)
  // localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = 'login.html';
});
