// API Configuration - Data Layer
const API_KEY = 'YOUR_API_KEY_HERE'; // Students replace with their API Ninjas key
const QUOTES_URL = 'https://api.api-ninjas.com/v1/quotes';
const FACTS_URL = 'https://api.api-ninjas.com/v1/facts';

// Get DOM elements
const refreshBtn = document.getElementById('refreshBtn');
const quoteCategory = document.getElementById('quoteCategory');
const quoteDisplay = document.getElementById('quoteDisplay');
const factDisplay = document.getElementById('factDisplay');
const loadingQuote = document.getElementById('loadingQuote');
const loadingFact = document.getElementById('loadingFact');
const errorDisplay = document.getElementById('errorDisplay');
const errorMessage = document.getElementById('errorMessage');

// Processing Layer - API Request Function
async function makeAPIRequest(url, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const fullUrl = queryParams ? `${url}?${queryParams}` : url;
    
    const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
            'X-Api-Key': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

// Processing Layer - Get Quote Data
async function getQuote(category) {
    try {
        showLoading('quote', true);
        
        const data = await makeAPIRequest(QUOTES_URL, { category: category });
        
        if (!data || data.length === 0) {
            throw new Error('No quotes found for this category');
        }
        
        return data[0]; // API returns array, we want first quote
    } catch (error) {
        throw new Error(`Failed to get quote: ${error.message}`);
    } finally {
        showLoading('quote', false);
    }
}

// Processing Layer - Get Fact Data
async function getFact() {
    try {
        showLoading('fact', true);
        
        const data = await makeAPIRequest(FACTS_URL);
        
        if (!data || data.length === 0) {
            throw new Error('No facts available');
        }
        
        return data[0]; // API returns array, we want first fact
    } catch (error) {
        throw new Error(`Failed to get fact: ${error.message}`);
    } finally {
        showLoading('fact', false);
    }
}

// UI Layer - Display Functions
function displayQuote(quoteData) {
    quoteDisplay.innerHTML = `
        <div class="quote-content">
            <p class="quote-text">"${quoteData.quote}"</p>
            <p class="quote-author">— ${quoteData.author}</p>
        </div>
    `;
}

function displayFact(factData) {
    factDisplay.innerHTML = `
        <div class="fact-content">
            <p class="fact-text">${factData.fact}</p>
        </div>
    `;
}

function showLoading(type, isLoading) {
    const loadingElement = type === 'quote' ? loadingQuote : loadingFact;
    const contentElement = type === 'quote' ? quoteDisplay : factDisplay;
    
    if (isLoading) {
        loadingElement.classList.remove('hidden');
        contentElement.classList.add('content-updating');
        refreshBtn.disabled = true;
    } else {
        loadingElement.classList.add('hidden');
        contentElement.classList.remove('content-updating');
        refreshBtn.disabled = false;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorDisplay.classList.remove('hidden');
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorDisplay.classList.add('hidden');
    }, 5000);
}

// Main Functions - Bringing it all together
async function loadQuote() {
    try {
        const category = quoteCategory.value;
        const quoteData = await getQuote(category);
        displayQuote(quoteData);
    } catch (error) {
        console.error('Quote loading error:', error);
        quoteDisplay.innerHTML = `
            <div class="error-content">
                <p>❌ Unable to load quote</p>
                <p style="font-size: 0.9em; color: #7f8c8d;">${error.message}</p>
            </div>
        `;
    }
}

async function loadFact() {
    try {
        const factData = await getFact();
        displayFact(factData);
    } catch (error) {
        console.error('Fact loading error:', error);
        factDisplay.innerHTML = `
            <div class="error-content">
                <p>❌ Unable to load fact</p>
                <p style="font-size: 0.9em; color: #7f8c8d;">${error.message}</p>
            </div>
        `;
    }
}

async function refreshContent() {
    // Load both quote and fact simultaneously
    await Promise.all([
        loadQuote(),
        loadFact()
    ]);
}

// Event Listeners - UI Layer
refreshBtn.addEventListener('click', refreshContent);

quoteCategory.addEventListener('change', loadQuote);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('📚 Daily Inspiration & Facts loaded!');
    console.log('Data Layer: Connected to API Ninjas (Quotes + Facts)');
    console.log('Processing Layer: Ready for multiple API requests');
    console.log('UI Layer: Event listeners attached');
    
    // Check if API key is configured
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please add your API Ninjas key to script.js');
        return;
    }
    
    // Load initial content
    refreshContent();
});

// Professional error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e);
    showError('Something went wrong. Please refresh the page.');
});

// Handle network connectivity issues
window.addEventListener('online', () => {
    console.log('Connection restored');
    refreshContent();
});

window.addEventListener('offline', () => {
    showError('No internet connection. Content will update when connection is restored.');
});
