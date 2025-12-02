const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Built-in bot responses
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

// Custom intents
const intents = [
    {
        patterns: [
            "does lulu love kutu",
            "does lulu love me",
            "does kutu love lulu"
        ],
        responses: [
            "Yes, Lulu loves Kutu very much!",
            "Lulu and Kutu are best friends!",
            "Absolutely! Lulu loves Kutu!"
        ]
    }
];

// Helper: lowercase + remove punctuation
function cleanText(text) {
    return text.toLowerCase().replace(/[^\w\s]/gi, '').trim();
}

// Add message to chat
function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.style.display = 'block';
    indicator.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(indicator);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// Main bot response
function getBotResponse(message) {
    const cleanMessage = cleanText(message);

    // 1️⃣ Check custom intents
    for (let intent of intents) {
        for (let pattern of intent.patterns) {
            if (cleanMessage === cleanText(pattern)) {
                return intent.responses[Math.floor(Math.random() * intent.responses.length)];
            }
        }
    }

    // 2️⃣ Check built-in responses
    if (cleanMessage.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
        return responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
    }

    if (cleanMessage.match(/^(bye|goodbye|see you|farewell|see ya)/)) {
        return responses.farewell[Math.floor(Math.random() * responses.farewell.length)];
    }

    if (cleanMessage.match(/(thank|thanks|thx|appreciate)/)) {
        return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
    }

    if (cleanMessage.match(/(how are you|how r u|how're you|hows it going|whats up)/)) {
        return responses.howareyou[Math.floor(Math.random() * responses.howareyou.length)];
    }

    if (cleanMessage.match(/(your name|who are you|what are you)/)) {
        return responses.name[Math.floor(Math.random() * responses.name.length)];
    }

    if (cleanMessage.match(/(help|what can you do|your purpose|capabilities)/)) {
        return responses.help[Math.floor(Math.random() * responses.help.length)];
    }

    if (cleanMessage.includes("weather")) {
        return "I don't have access to real-time weather data, but I hope it's nice where you are!";
    }

    if (cleanMessage.match(/(what time|current time|time is it)/)) {
        const now = new Date();
        return `The current time is ${now.toLocaleTimeString()}.`;
    }

    if (cleanMessage.match(/(what date|today's date|current date)/)) {
        const now = new Date();
        return `Today's date is ${now.toLocaleDateString()}.`;
    }

    // 3️⃣ Default fallback
    return responses.default[Math.floor(Math.random() * responses.default.length)];
}

// Send message
function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    userInput.value = '';

    showTypingIndicator();

    setTimeout(() => {
        removeTypingIndicator();
        const botResponse = getBotResponse(message);
        addMessage(botResponse, false);
    }, 800 + Math.random() * 400);
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

userInput.focus();
