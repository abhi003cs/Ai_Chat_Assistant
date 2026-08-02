// ---------------- Gemini API ----------------

const API_KEY = "ADD YOUR_ACTUAL_API_KEY HERE";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

// ---------------- Theme Toggle ----------------

const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = themeToggle.querySelector("i");

const changeTheme = () => {

    document.body.classList.toggle("light-theme");

    if (document.body.classList.contains("light-theme")) {

    themeIcon.classList.replace("fa-moon", "fa-sun");

    localStorage.setItem("theme", "light");

}
else {

    themeIcon.classList.replace("fa-sun", "fa-moon");

    localStorage.setItem("theme", "dark");

}

};

const savedTheme = localStorage.getItem("theme");

if(savedTheme === "light"){

    document.body.classList.add("light-theme");

    themeIcon.classList.replace("fa-moon","fa-sun");

}

themeToggle.addEventListener("click", changeTheme);


// ---------------- Chat Elements ----------------

const chatInput = document.querySelector(".chat-input textarea");
const sendBtn = document.querySelector(".send-btn");
const micBtn = document.querySelector(".mic-btn");
const chatContainer = document.querySelector(".chat-container");
const welcomeScreen = document.querySelector(".welcome-screen");
const newChatBtn = document.querySelector(".new-chat");
const deleteAllBtn = document.querySelector(".delete-all-chat");
const historyList = document.querySelector(".history-list");
const searchInput = document.querySelector(".search-bar input");
const profileBtn = document.querySelector(".profile-btn");
const profileModal = document.querySelector(".profile-modal");
const closeProfile = document.querySelector(".close-profile");


let chats = [];
const savedChats = localStorage.getItem("chats");

if (savedChats) {
    chats = JSON.parse(savedChats);
}

let currentChat = {
    title: "",
    messages: []
};

const typeEffect = (element, text) => {

    let index = 0;

    element.innerHTML = "";

    const interval = setInterval(() => {

        element.innerHTML += text[index];

        index++;

        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (index === text.length) {

            clearInterval(interval);

            element.classList.remove("typing-indicator");

            element.innerHTML = marked.parse(text);

            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

    }, 15);

};


// ---------------- Send Message ----------------

const sendMessage = async () => {

    const message = chatInput.value.trim();


    if(message === ""){
        return;
    }

    if (currentChat.title === "") {

    let words = message.split(" ");

    currentChat.title = words.slice(0, 5).join(" ");

    if(words.length > 5){
        currentChat.title += "...";
    }

    }


    // Create User Message

    const newDiv = document.createElement("div");
    newDiv.classList.add("user-message");
    newDiv.textContent = message;

    welcomeScreen.style.display = "none";

    chatContainer.appendChild(newDiv);

    currentChat.messages.push({
    role: "user",
    text: message
    });



    // Create AI Message

    const aiContainer = document.createElement("div");
    aiContainer.classList.add("ai-container");

    const aiDiv = document.createElement("div");
    aiDiv.classList.add("ai-message", "typing-indicator");
    aiDiv.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    const copyBtn = document.createElement("button");
    copyBtn.classList.add("copy-btn");
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    

    aiContainer.appendChild(aiDiv);
    aiContainer.appendChild(copyBtn);

    chatContainer.appendChild(aiContainer);



    chatInput.value = "";
    chatInput.style.height = "auto";

    chatContainer.scrollTop = chatContainer.scrollHeight;

// ---------------- Gemini API ----------------

try {

    const response = await fetch(API_URL, {

        method: "POST",

    headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
    },

        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: message
                        }
                    ]
                }
            ]
        })

    });


   if (!response.ok) {

    const errorData = await response.json();

    console.log("Gemini Error:", errorData);

    throw new Error(errorData.error.message);

}


    const data = await response.json();


    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";

    copyBtn.addEventListener("click", () => {

    navigator.clipboard.writeText(aiResponse);

    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';

    setTimeout(() => {

        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';

        }, 2000);

    });
    typeEffect(aiDiv, aiResponse);

    currentChat.messages.push({
        role: "ai",
        text: aiResponse
    });
localStorage.setItem("chats", JSON.stringify(chats));
  

}

catch (error) {

    copyBtn.remove();

    if (error.message.includes("quota")) {
        aiDiv.textContent = "⚠️ API limit reached. Please wait a few seconds and try again.";
    } else {
        aiDiv.textContent = "Sorry, I couldn't get a response.";
    }

}

};


const startNewChat = () => {

    if (currentChat.messages.length > 0) {
        chats.push(currentChat);
        currentChat = {
        title: "",
        messages: []
        };
        renderHistory();
        localStorage.setItem("chats", JSON.stringify(chats));
    }

    // Remove all chat messages
    chatContainer.innerHTML = "";

    // Show welcome screen again
    welcomeScreen.style.display = "flex";

    // Clear input
    chatInput.value = "";

    // Focus on input
    chatInput.focus();

};


const deleteAllChats = () => {

    const confirmDelete = confirm("Are you sure you want to delete all chats?");

    if (!confirmDelete) return;

    chats = [];

    currentChat = {
        title: "",
        messages: []
    };

    renderHistory();

    chatContainer.innerHTML = "";

    welcomeScreen.style.display = "flex";

    chatInput.focus();

    localStorage.removeItem("chats");

};


const renderHistory = (searchText = "") => {

    historyList.innerHTML = "";

    const filteredChats = chats
    .filter((chat) =>
        chat.title.toLowerCase().includes(searchText.toLowerCase())
    )
    .slice()
    .reverse();

    if (filteredChats.length === 0) {

        historyList.innerHTML = `
            <p class="empty-history">No Recent Chats</p>
        `;

        return;
    }

    filteredChats.forEach((chat) => {

        const li = document.createElement("li");

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.classList.add("delete-chat-btn");

        const title = document.createElement("span");
        title.textContent = chat.title;

        li.appendChild(title);
        li.appendChild(deleteBtn);

        historyList.appendChild(li);

        // Delete Chat
        deleteBtn.addEventListener("click", (event) => {

            event.stopPropagation();

            const index = chats.indexOf(chat);

            chats.splice(index, 1);

            if (currentChat === chat) {

                currentChat = {
                    title: "",
                    messages: []
                };

                chatContainer.innerHTML = "";
                welcomeScreen.style.display = "flex";
            }

            renderHistory(searchInput.value);

            localStorage.setItem("chats", JSON.stringify(chats));

        });

        // Open Chat
        li.addEventListener("click", () => {

            welcomeScreen.style.display = "none";
            chatContainer.innerHTML = "";

            chat.messages.forEach((message) => {

                // User Message
                if (message.role === "user") {

                    const messageDiv = document.createElement("div");

                    messageDiv.classList.add("user-message");
                    messageDiv.textContent = message.text;

                    chatContainer.appendChild(messageDiv);

                }

                // AI Message
                else {

                    const aiContainer = document.createElement("div");
                    aiContainer.classList.add("ai-container");

                    const aiDiv = document.createElement("div");
                    aiDiv.classList.add("ai-message");
                    aiDiv.innerHTML = marked.parse(message.text);

                    const copyBtn = document.createElement("button");
                    copyBtn.classList.add("copy-btn");
                    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';

                    copyBtn.addEventListener("click", () => {

                        navigator.clipboard.writeText(message.text);

                        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';

                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
                        }, 2000);

                    });

                    aiContainer.appendChild(aiDiv);
                    aiContainer.appendChild(copyBtn);

                    chatContainer.appendChild(aiContainer);

                }

            });

            currentChat = chat;
            chatContainer.scrollTop = chatContainer.scrollHeight;
            chatInput.focus();

        });

    });

};
renderHistory();
searchInput.addEventListener("input", () => {
    renderHistory(searchInput.value);
});


// ---------------- Button Click ----------------

sendBtn.addEventListener("click", sendMessage);

newChatBtn.addEventListener("click", startNewChat);

deleteAllBtn.addEventListener("click", deleteAllChats);



// ---------------- Enter Key ----------------

chatInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();

    }

});
chatInput.addEventListener("input", () => {

    chatInput.style.height = "auto";

    chatInput.style.height = chatInput.scrollHeight + "px";

});


// ---------------- Suggestion Cards ----------------

const suggestionCards = document.querySelectorAll(".suggestion-card");


suggestionCards.forEach((card)=>{

    card.addEventListener("click",()=>{

        const text = card.querySelector("span").textContent;

        chatInput.value = text;

        sendMessage();

    });

});


// ---------------- Voice Input ----------------

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    micBtn.addEventListener("click", () => {

        recognition.start();

        micBtn.classList.add("listening");

    });

    recognition.onresult = (event) => {

    const transcript = event.results[0][0].transcript;

    chatInput.value = transcript;

    chatInput.focus();

    // Automatically send the message
    sendMessage();

    };

    recognition.onend = () => {

        micBtn.classList.remove("listening");

    };

    recognition.onerror = () => {

        micBtn.classList.remove("listening");

    };

}
else{

    alert("Speech Recognition is not supported in this browser.");

}


// ---------- Profile Popup ----------

profileBtn.addEventListener("click", () => {

    profileModal.style.display = "flex";

});

closeProfile.addEventListener("click", () => {

    profileModal.style.display = "none";

});

profileModal.addEventListener("click", (e) => {

    if (e.target === profileModal) {

        profileModal.style.display = "none";

    }

});