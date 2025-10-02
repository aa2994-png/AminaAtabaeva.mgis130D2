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

// Favorites system storage
let favorites = { quotes: [], facts: [] };

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

// Helper function to escape quotes for HTML attributes
function escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Copy to clipboard functionality
async function copyToClipboard(text, type) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification(`${type === 'quote' ? 'Quote' : 'Fact'} copied to clipboard! 📋`, 'success');
    } catch (error) {
        showNotification('Failed to copy. Please try again.', 'error');
    }
}

// Share functionality
function shareQuote(quote, author) {
    const shareText = `"${quote}" — ${author}`;
    shareContent(shareText);
}

function shareFact(fact) {
    shareContent(fact);
}

function shareContent(text) {
    if (navigator.share) {
        navigator.share({
            text: text,
            title: 'Daily Inspiration'
        }).catch(() => {
            // User cancelled share
        });
    } else {
        // Fallback: copy to clipboard
        copyToClipboard(text, 'content');
    }
}

// Add character/word count
function addCharacterCount(text, type) {
    const words = text.split(/\s+/).length;
    const chars = text.length;
    const display = type === 'quote' ? quoteDisplay : factDisplay;
    
    const counter = document.createElement('div');
    counter.style.cssText = 'margin-top: 10px; font-size: 0.85em; color: #95a5a6; text-align: right;';
    counter.textContent = `${words} words • ${chars} characters`;
    
    display.querySelector('.quote-content, .fact-content').appendChild(counter);
}

// Favorites system
function toggleFavorite(type, text, author = '') {
    const key = type === 'quote' ? 'quotes' : 'facts';
    const item = type === 'quote' ? { text, author } : { text };
    
    const index = favorites[key].findIndex(fav => fav.text === text);
    
    if (index > -1) {
        favorites[key].splice(index, 1);
        showNotification('Removed from favorites', 'info');
    } else {
        favorites[key].push(item);
        showNotification('Added to favorites! ⭐', 'success');
    }
    
    displayFavorites();
}

function displayFavorites() {
    const totalFavorites = favorites.quotes.length + favorites.facts.length;
    
    let favCounter = document.getElementById('favCounter');
    if (!favCounter && totalFavorites > 0) {
        favCounter = document.createElement('div');
        favCounter.id = 'favCounter';
        favCounter.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f39c12; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; cursor: pointer; z-index: 1000;';
        favCounter.onclick = showFavoritesModal;
        document.body.appendChild(favCounter);
    }
    
    if (favCounter) {
        if (totalFavorites > 0) {
            favCounter.textContent = `⭐ ${totalFavorites} Saved`;
            favCounter.style.display = 'block';
        } else if (favCounter.parentNode) {
            favCounter.style.display = 'none';
        }
    }
}

function showFavoritesModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    let content = '<div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; max-height: 80vh; overflow-y: auto;">';
    content += '<h2 style="margin-top: 0;">Your Favorites ⭐</h2>';
    
    if (favorites.quotes.length > 0) {
        content += '<h3>Quotes</h3>';
        favorites.quotes.forEach((quote, i) => {
            content += `<div style="padding: 10px; margin: 10px 0; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 4px;">
                <p style="margin: 0;">"${quote.text}"</p>
                <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #7f8c8d;">— ${quote.author}</p>
            </div>`;
        });
    }
    
    if (favorites.facts.length > 0) {
        content += '<h3>Facts</h3>';
        favorites.facts.forEach((fact, i) => {
            content += `<div style="padding: 10px; margin: 10px 0; background: #f8f9fa; border-left: 4px solid #2ecc71; border-radius: 4px;">
                <p style="margin: 0;">${fact.text}</p>
            </div>`;
        });
    }
    
    if (favorites.quotes.length === 0 && favorites.facts.length === 0) {
        content += '<p style="text-align: center; color: #7f8c8d;">No favorites yet! Click the ⭐ Save button to add quotes and facts.</p>';
    }
    
    content += '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; width: 100%;">Close</button>';
    content += '</div>';
    
    modal.innerHTML = content;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        info: '#3498db'
    };
    
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// UI Layer - Display Functions with animations and interactions
function displayQuote(quoteData) {
    // Add fade-in animation
    quoteDisplay.style.opacity = '0';
    
    quoteDisplay.innerHTML = `
        <div class="quote-content">
            <p class="quote-text">"${quoteData.quote}"</p>
            <p class="quote-author">— ${quoteData.author}</p>
            <div class="quote-actions">
                <button class="action-btn" onclick="copyToClipboard('${escapeQuotes(quoteData.quote)}', 'quote')" title="Copy quote">
                    📋 Copy
                </button>
                <button class="action-btn" onclick="shareQuote('${escapeQuotes(quoteData.quote)}', '${escapeQuotes(quoteData.author)}')" title="Share quote">
                    🔗 Share
                </button>
                <button class="action-btn favorite-btn" onclick="toggleFavorite('quote', '${escapeQuotes(quoteData.quote)}', '${escapeQuotes(quoteData.author)}')" title="Add to favorites">
                    ⭐ Save
                </button>
            </div>
        </div>
    `;
    
    // Fade in animation
    setTimeout(() => {
        quoteDisplay.style.transition = 'opacity 0.5s ease-in';
        quoteDisplay.style.opacity = '1';
    }, 50);
    
    // Add character count
    addCharacterCount(quoteData.quote, 'quote');
}

function displayFact(factData) {
    // Add fade-in animation
    factDisplay.style.opacity = '0';
    
    factDisplay.innerHTML = `
        <div class="fact-content">
            <p class="fact-text">${factData.fact}</p>
            <div class="fact-actions">
                <button class="action-btn" onclick="copyToClipboard('${escapeQuotes(factData.fact)}', 'fact')" title="Copy fact">
                    📋 Copy
                </button>
                <button class="action-btn" onclick="shareFact('${escapeQuotes(factData.fact)}')" title="Share fact">
                    🔗 Share
                </button>
                <button class="action-btn favorite-btn" onclick="toggleFavorite('fact', '${escapeQuotes(factData.fact)}')" title="Add to favorites">
                    ⭐ Save
                </button>
            </div>
        </div>
    `;
    
    // Fade in animation
    setTimeout(() => {
        factDisplay.style.transition = 'opacity 0.5s ease-in';
        factDisplay.style.opacity = '1';
    }, 50);
    
    // Add word count
    addCharacterCount(factData.fact, 'fact');
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

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // R key - Refresh
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            refreshContent();
            showNotification('Content refreshed! 🔄', 'info');
        }
        
        // F key - Show favorites
        if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            showFavoritesModal();
        }
    });
    
    // Add keyboard hints
    const hints = document.createElement('div');
    hints.style.cssText = 'position: fixed; bottom: 20px; left: 20px; background: rgba(52, 73, 94, 0.9); color: white; padding: 10px 15px; border-radius: 8px; font-size: 0.85em; z-index: 1000;';
    hints.innerHTML = '<strong>Shortcuts:</strong> Press <kbd style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">R</kbd> to refresh • <kbd style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">F</kbd> for favorites';
    document.body.appendChild(hints);
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
    
    // Check if API key is configured (FIXED)
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE' || API_KEY.length < 10) {
        showError('Please add your API Ninjas key to script.js');
        return;
    }
    
    // Initialize favorites display
    displayFavorites();
    
    // Add keyboard shortcuts
    setupKeyboardShortcuts();
    
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
    showNotification('Connection restored! 🌐', 'success');
    refreshContent();
});

window.addEventListener('offline', () => {
    showError('No internet connection. Content will update when connection is restored.');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .quote-actions, .fact-actions {
        display: flex;
        gap: 8px;
        margin-top: 15px;
        flex-wrap: wrap;
    }
    
    .action-btn {
        padding: 6px 12px;
        background: #ecf0f1;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.2s ease;
    }
    
    .action-btn:hover {
        background: #3498db;
        color: white;
        transform: translateY(-2px);
    }
    
    .action-btn:active {
        transform: translateY(0);
    }
    
    kbd {
        font-family: monospace;
    }
`;
document.head.appendChild(style);
