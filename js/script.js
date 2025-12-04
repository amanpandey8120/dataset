// Bot responses database
const responses = {
    greetings: [
        "Hello! How can I assist you today?",
        "Hi there! What can I do for you?",
        "Hey! Nice to meet you!",
        "Greetings! How may I help you?"
    ],
    farewell: [
        "Goodbye! Have a great day!",
        "See you later! Take care!",
        "Bye! Feel free to come back anytime!",
        "Farewell! It was nice chatting with you!"
    ],
    thanks: [
        "You're welcome! Happy to help!",
        "No problem at all!",
        "Anytime! That's what I'm here for!",
        "Glad I could help!"
    ],
    howareyou: [
        "I'm doing great, thank you for asking! How about you?",
        "I'm just a bot, but I'm functioning perfectly! How are you?",
        "I'm excellent! Ready to chat with you!"
    ],
    name: [
        "I'm ChatBot, your friendly AI assistant!",
        "You can call me ChatBot!",
        "I'm ChatBot, nice to meet you!"
    ],
    help: [
        "I can chat with you, answer questions, and have friendly conversations! Just type anything you'd like to talk about.",
        "I'm here to chat and help! You can ask me about myself, have a conversation, or just say hello!",
        "Feel free to ask me anything or just chat! I can discuss various topics with you."
    ],
    lulukuktu: [
        "Yes, Lulu loves Kutu very much!",
        "Lulu and Kutu are best friends!",
        "Absolutely! Lulu loves Kutu!"
    ],
    default: [
        "That's interesting! Tell me more.",
        "I see! Can you elaborate on that?",
        "Interesting point! What else would you like to know?",
        "I appreciate you sharing that! Anything else on your mind?",
        "That's a good question! While I'm a simple chatbot, I'm here to chat with you.",
        "I'm still learning, but I'd love to continue our conversation!",
        "Thanks for chatting with me! What else would you like to talk about?"
    ]
};

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Get random response from array
function getRandomResponse(responseArray) {
    return responseArray[Math.floor(Math.random() * responseArray.length)];
}

// Local fallback function
function getLocalBotResponse(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Greetings
    if (lowerMessage.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
        return getRandomResponse(responses.greetings);
    }

    // Farewell
    if (lowerMessage.match(/^(bye|goodbye|see you|farewell|see ya)/)) {
        return getRandomResponse(responses.farewell);
    }

    // Thanks
    if (lowerMessage.match(/(thank|thanks|thx|appreciate)/)) {
        return getRandomResponse(responses.thanks);
    }

    // How are you
    if (lowerMessage.match(/(how are you|how r u|how're you|hows it going|whats up)/)) {
        return getRandomResponse(responses.howareyou);
    }

    // Name
    if (lowerMessage.match(/(your name|who are you|what are you)/)) {
        return getRandomResponse(responses.name);
    }

    // Help
    if (lowerMessage.match(/(help|what can you do|your purpose|capabilities)/)) {
        return getRandomResponse(responses.help);
    }

    // LuluKuktu
    if (lowerMessage.match(/lulu.*kutu|kutu.*lulu/)) {
        return getRandomResponse(responses.lulukuktu);
    }

    // Default response
    return getRandomResponse(responses.default);
}

// Add message to chat
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'typing-indicator';
    contentDiv.innerHTML = '<span></span><span></span><span></span>';
    
    typingDiv.appendChild(contentDiv);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingDiv = document.getElementById('typingIndicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Send message to server
async function sendMessageToServer(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Server error, using local response:', error);
        // Use local fallback
        return getLocalBotResponse(message);
    }
}

// Main send message function
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;

    // Add user message
    addMessage(message, true);
    userInput.value = '';
    userInput.focus();

    // Show typing indicator
    showTypingIndicator();

    try {
        // Try to get response from server
        const botResponse = await sendMessageToServer(message);
        
        // Remove typing indicator and add bot response
        removeTypingIndicator();
        addMessage(botResponse, false);
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        addMessage("Sorry, I'm having trouble responding right now. Please try again.", false);
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Focus input on load
userInput.focus();

// Add welcome message
window.onload = function() {
    setTimeout(() => {
        addMessage("Hello! I'm ChatBot. Type a message to start chatting!", false);
    }, 500);
};
