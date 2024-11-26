let output = '```json {blahblabblah} ``` blabblabblan';
const lines = output.split('```');
let pos = -1;
for (let i = 0; i < lines.length; i++) {
    if(lines[i].includes('json')) {
        pos = i;
    }
    lines[i] = lines[i].replace(/\b(json)\b/g, '').trim();
}
console.log(lines);




// api key is initialized as an empty string
let apiKey = '';

// function to validate the api key, called onClick by api-btn
async function validate() {
    
    // feel free to uncomment log messages for testing
    // console.log(document.getElementById('valid-input').value);

    // api key is set to the value of the input field
    apiKey = document.getElementById('key-input').value;

    // if the api key is empty, an alert is shown
    if (apiKey.trim() === "") {
        alert("Please enter a valid API key.");
        return;
    }

    // fetch request to the openai api to validate the api key
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            // if api key is valid the validation div is hidden and the input container is shown
            document.getElementById('validation').style.display = 'none';
            document.getElementById('input-container').style.display = 'flex';
            // open ai constant is set to the api key
            OPENAI_API_KEY = apiKey;
            // initial greeting is initiated
            sendInitialGreeting();
        } else {
            alert("Invalid API key. Please try again.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while validating the API key. Please try again.");
    }
}

let OPENAI_API_KEY = apiKey; // Replace with your API key

// System prompt for the bot, implemented directly after instantiation
const systemPrompt = {
    role: "system",
    content: "Simulate a smart assistant for a food 3D printer that helps users create and customize dishes by replicating existing foods or generating new recipes based on their input and preferences. Once the dish is decided upon, return a brief description of the dish, followed by a JSON object including the basic molecular components and quantities required, printer settings, and usage instructions.\n\nYou will guide users in describing the dish they wish to create. This can include replicating a specific dish, combining elements from various cuisines, or inventing something entirely new. Once the user provides the details, assess the feasibility of their request based on the available ingredients and generate a final design.\n\nThe molecular breakdown must only include elemental components such as nitrogen, carbon, oxygen, phosphorus, and others. Do not include specific raw food ingredients.\n\n# Output Format\n\nThe response should be in the following structured JSON format:\n\n```\n{\n  \"dish_name\": \"(Name of the dish)\",\n  \"description\": \"(Short, appetizing description of the dish)\",\n  \"cuisine_type\": \"(Cuisine style or category)\",\n  \"molecular_breakdown\": {\n    \"total_nitrogen\": \"(Total grams of nitrogen required)\",\n    \"total_carbon\": \"(Total grams of carbon required)\",\n    \"total_oxygen\": \"(Total grams of oxygen required)\",\n    \"total_phosphorus\": \"(Total grams of phosphorus required)\"\n  },\n  \"nutritional_info\": {\n    \"proteins\": \"(Grams of proteins in the dish)\",\n    \"carbohydrates\": \"(Grams of carbohydrates in the dish)\",\n    \"fats\": \"(Grams of fats in the dish)\",\n    \"calories\": \"(Estimated total calories)\"\n  },\n  \"printer_settings\": {\n    \"temperature\": \"(Temperature in Celsius required for printing)\",\n    \"print_speed\": \"(Print speed in mm/sec)\",\n    \"layer_thickness\": \"(Layer thickness in mm)\"\n  },\n  \"usage_instructions\": {\n    \"loading_steps\": [\n      \"(Step 1: Load the nitrogen cartridge)\",\n      \"(Step 2: Load the carbon cartridge)\"\n      // Additional loading steps as needed\n    ],\n    \"safety_notes\": \"(Relevant safety notes to adhere to during printing)\"\n  }\n}\n```\n\n# Examples\n\n**Input Example 1:**\nUser wants a dish that combines Indian cuisine with a slight Mexican twist — a curry-based burrito wrap that’s vegan and rich in fiber.\n\n**Output Example 1:**\n```\n{\n  \"dish_name\": \"Vegan Curry Fusion Wrap\",\n  \"description\": \"A delightful twist marrying Indian curry flavors with a Mexican-style wrap. Filled with spiced chickpea curry and mixed vegetables, offering a tangy twist while packed with fiber.\",\n  \"cuisine_type\": \"Fusion (Indian-Mexican)\",\n  \"molecular_breakdown\": {\n    \"total_nitrogen\": \"5g\",\n    \"total_carbon\": \"40g\",\n    \"total_oxygen\": \"30g\",\n    \"total_phosphorus\": \"1.5g\"\n  },\n  \"nutritional_info\": {\n    \"proteins\": \"20g\",\n    \"carbohydrates\": \"60g\",\n    \"fats\": \"10g\",\n    \"calories\": \"400\"\n  },\n  \"printer_settings\": {\n    \"temperature\": \"180°C\",\n    \"print_speed\": \"20 mm/sec\",\n    \"layer_thickness\": \"0.8 mm\"\n  },\n  \"usage_instructions\": {\n    \"loading_steps\": [\n      \"Step 1: Load the nitrogen cartridge.\",\n      \"Step 2: Load the carbon cartridge.\",\n      \"Step 3: Load the oxygen and phosphorus cartridges to the respective slots.\"\n    ],\n    \"safety_notes\": \"Ensure all cartridges are correctly aligned before printing. Be cautious of hot components during operation.\"\n  }\n}\n```\n\n# Notes\n\n- Keep the molecular components broken down to clearly communicate the fundamental building blocks, specifically nitrogen, carbon, oxygen, phosphorus, and other essential elements where appropriate.\n- Always confirm dietary preferences or restrictions to ensure the proposed design aligns with user requirements.\n- Ensure printer settings are optimal for distinct dish requirements and clearly guide the user throughout the process, paying special attention to avoiding hazards."
};

// Initialize chat history to be used by the bot
let messageHistory = [systemPrompt];
// initial variables for chat-container, user-input
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');

// Enter key handling
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// function to generate inital greeting, to introduce the user to the chatbot
async function sendInitialGreeting() {
    const loadingDiv = addLoadingIndicator();
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [...messageHistory, {
                    role: "user",
                    content: "Greet the user with a breif introduction."
                }],
                temperature: 0.6
            })
        });

        const data = await response.json();
        loadingDiv.remove();

        // bot response is processed and displayed
        if (data.choices && data.choices[0]) {
            processAndDisplayResponse(data.choices[0].message.content);
            messageHistory.push({
                role: "assistant",
                content: data.choices[0].message.content
            });
        }
    } catch (error) {
        loadingDiv.remove();
        addMessageToChat("Sorry, there was an error starting the bot. Please refresh to try again.", 'bot');
        console.error('Error:', error);
    }
}

// function to allow the user to send a message to the bot
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    userInput.value = '';

    // Add loading indicator
    const loadingDiv = addLoadingIndicator();

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [...messageHistory, {
                    role: "user",
                    content: message
                }],
                temperature: 0.6
            })
        });

        const data = await response.json();
        loadingDiv.remove();

        if (data.choices && data.choices[0]) {
            processAndDisplayResponse(data.choices[0].message.content);
            messageHistory.push(
                { role: "user", content: message },
                { role: "assistant", content: data.choices[0].message.content }
            );
        }
    } catch (error) {
        loadingDiv.remove();
        addMessageToChat("Sorry, I encountered an error. Please try again.", 'bot');
        console.error('Error:', error);
    }
}


// function to check if the current output is a normal response or a recipe
// if the response is a recipe, the creation of a new recipe object should be initiated
async function processAndDisplayResponse(content) {
    if(content.includes('dish_name')) {
        // if the response is a recipe, the creation of a new recipe object should be initiated
        createRecipe(content);
    } else {
        addMessageToChat(content, 'bot');
    }
}

function createRecipe(content) {
    // split the content into an array of lines
    const lines = content.split('```');
    let pos = -1;
    for (let i = 0; i < lines.length; i++) {
        if(lines[i].includes('dish_name')) {
            pos = i;
        }
        lines[i] = lines[i].replace(/\b(json)\b/g, '').trim();
    }
    console.log(lines);
    let recipe = JSON.parse(lines[pos]);
    console.log(recipe);
    let intro = lines[0].split(/[.!?]/g)
    addMessageToChat(intro[0] + '! ' + intro[1] + '.', 'bot');
}

// helper function to add message to chat based on the agent 'type'
function addMessageToChat(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (type === 'user') {
        messageDiv.classList.add('user-message');
        messageDiv.innerHTML = `<span class="bot-name">User: </span>${message}`;
    } else if (type === 'bot') {
        messageDiv.classList.add('bot-message');
        messageDiv.innerHTML = `<span class="bot-name">Foodbot: </span>${message}`;
    } 

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// helper function to add loading indicator to chat
function addLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot-message', 'loading');
    loadingDiv.textContent = 'FoodBot is thinking...';
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return loadingDiv;
}