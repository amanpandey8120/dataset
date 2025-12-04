const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

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

// Get random response
function getRandomResponse(responseArray) {
    return responseArray[Math.floor(Math.random() * responseArray.length)];
}

function getBotResponse(message) {
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

    // Weather
    if (lowerMessage.match(/weather/)) {
        return "I don't have access to real-time weather data, but I hope it's nice where you are!";
    }

    // Time
    if (lowerMessage.match(/(what time|current time|time is it)/)) {
        const now = new Date();
        return `The current time is ${now.toLocaleTimeString()}.`;
    }

    // Date
    if (lowerMessage.match(/(what date|today's date|current date)/)) {
        const now = new Date();
        return `Today's date is ${now.toLocaleDateString()}.`;
    }

    // LuluKuktu
    if (lowerMessage.match(/lulu.*kutu|kutu.*lulu/)) {
        return getRandomResponse(responses.lulukuktu);
    }

    // Default response
    return getRandomResponse(responses.default);
}

// API endpoint for chatbot
app.post('/api/chat', (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required and must be a string' });
        }

        // Simulate thinking delay
        setTimeout(() => {
            const response = getBotResponse(message);
            res.json({ response });
        }, 500 + Math.random() * 500); // Random delay between 500-1000ms
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Chatbot server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
