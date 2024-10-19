const socket = io('http://localhost:3000');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');

// Prompt the user for their name
const name = prompt('What is your name?');
appendMessage('You joined');
socket.emit('new-user', name);

// Listen for incoming chat messages
socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`);
});

// Listen for user connection events
socket.on('user-connected', name => {
  appendMessage(`${name} Connected`);
});

// Listen for user disconnection events
socket.on('user-disconnected', name => {
  appendMessage(`${name} Disconnected`);
});

// Handle message form submission
messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = messageInput.value;
  appendMessage(`You: ${message}`);
  socket.emit('send-chat-message', message);
  messageInput.value = ''; // Clear input field after sending
});

// Function to append messages to the chat
function appendMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.innerText = message;
  messageContainer.append(messageElement);
  // Scroll to the bottom of the message container
  messageContainer.scrollTop = messageContainer.scrollHeight;
}
