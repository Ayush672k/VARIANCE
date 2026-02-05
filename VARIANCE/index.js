import addOnUISdk from "https://express.adobe.com/static/add-on-sdk/sdk.js";

// Global state
let sandboxProxy = null;
let panelProxy = null;
const GEMINI_API_KEY = 'ADD A GEMINI API';

// TEST MODE: Set to true to bypass Imagen API and use test image
const TEST_MODE = true; // Change to false when Imagen API is working

// Score tracking state
let currentScore = 0;
let baseScore = 0; // Score from analysis calculation
let scoreBonus = 0; // Bonus from applied suggestions
let appliedSuggestions = new Set(); // Track which suggestions have been applied
const SCORE_INCREMENT = 2; // Percentage points to add per suggestion
const MAX_SCORE = 100;

// State to Language Mapping
const STATE_LANGUAGE_MAP = {
    'Andhra Pradesh': ['Telugu', 'Hindi', 'English'],
    'Arunachal Pradesh': ['English', 'Hindi'],
    'Assam': ['Assamese', 'Bengali', 'Bodo', 'Hindi', 'English'],
    'Bihar': ['Hindi', 'Maithili', 'Urdu', 'English'],
    'Chhattisgarh': ['Hindi', 'Chhattisgarhi', 'English'],
    'Goa': ['Konkani', 'Marathi', 'Hindi', 'English'],
    'Gujarat': ['Gujarati', 'Hindi', 'English'],
    'Haryana': ['Hindi', 'Punjabi', 'English'],
    'Himachal Pradesh': ['Hindi', 'Pahari', 'English'],
    'Jharkhand': ['Hindi', 'Santali', 'Bengali', 'English'],
    'Karnataka': ['Kannada', 'Hindi', 'English'],
    'Kerala': ['Malayalam', 'Hindi', 'English'],
    'Madhya Pradesh': ['Hindi', 'Marathi', 'English'],
    'Maharashtra': ['Marathi', 'Hindi', 'English'],
    'Manipur': ['Manipuri', 'Hindi', 'English'],
    'Meghalaya': ['English', 'Khasi', 'Garo', 'Hindi'],
    'Mizoram': ['Mizo', 'Hindi', 'English'],
    'Nagaland': ['English', 'Hindi'],
    'Odisha': ['Odia', 'Hindi', 'English'],
    'Punjab': ['Punjabi', 'Hindi', 'English'],
    'Rajasthan': ['Hindi', 'Rajasthani', 'English'],
    'Sikkim': ['Nepali', 'Hindi', 'English'],
    'Tamil Nadu': ['Tamil', 'Hindi', 'English'],
    'Telangana': ['Telugu', 'Urdu', 'Hindi', 'English'],
    'Tripura': ['Bengali', 'Kokborok', 'Hindi', 'English'],
    'Uttar Pradesh': ['Hindi', 'Urdu', 'English'],
    'Uttarakhand': ['Hindi', 'Garhwali', 'Kumaoni', 'English'],
    'West Bengal': ['Bengali', 'Hindi', 'English'],
    'Andaman and Nicobar Islands': ['Hindi', 'English', 'Bengali'],
    'Chandigarh': ['Hindi', 'Punjabi', 'English'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Gujarati', 'Hindi', 'Konkani', 'English'],
    'Delhi': ['Hindi', 'Punjabi', 'Urdu', 'English'],
    'Jammu and Kashmir': ['Kashmiri', 'Urdu', 'Hindi', 'Dogri', 'English'],
    'Ladakh': ['Ladakhi', 'Hindi', 'Urdu', 'English'],
    'Lakshadweep': ['Malayalam', 'Hindi', 'English'],
    'Puducherry': ['Tamil', 'French', 'English', 'Hindi', 'Telugu']
};
// Sarvam API Configuration
const SARVAM_API_KEY = 'YOUR SARVAM API';
const SARVAM_API_URL = 'https://api.sarvam.ai/v1/translate';

/**
 * Map language names to Sarvam API language codes
 * Maps UI language names to BCP-47 language codes required by Sarvam API
 */
function getSarvamLanguageCode(languageName) {
    const languageMap = {
        'Hindi': 'hi-IN',
        'Tamil': 'ta-IN',
        'Telugu': 'te-IN',
        'Bengali': 'bn-IN',
        'Marathi': 'mr-IN',
        'Gujarati': 'gu-IN',
        'Kannada': 'kn-IN',
        'Malayalam': 'ml-IN',
        'Punjabi': 'pa-IN',
        'Odia': 'or-IN',
        'Assamese': 'as-IN',
        'Urdu': 'ur-IN',
        'English': 'en-IN',
        'Konkani': 'kok-IN',
        'Manipuri': 'mni-IN',
        'Khasi': 'kha-IN',
        'Garo': 'grt-IN',
        'Mizo': 'lus-IN',
        'Rajasthani': 'raj-IN',
        'Nepali': 'ne-IN',
        'Kokborok': 'trp-IN',
        'Maithili': 'mai-IN',
        'Chhattisgarhi': 'hne-IN',
        'Santali': 'sat-IN',
        'Bodo': 'brx-IN',
        'Kashmiri': 'ks-IN',
        'Dogri': 'doi-IN',
        'Ladakhi': 'lbj-IN',
        'Pahari': 'him-IN',
        'Garhwali': 'gbm-IN',
        'Kumaoni': 'kfy-IN',
        'French': 'fr-IN'
    };
    return languageMap[languageName] || 'en-IN';
}

// SDK Initialization
addOnUISdk.ready.then(async () => {
    console.log("Adobe Express Add-on UI SDK is ready");
    await initializeAddOn();
});

// Setup language selector immediately on DOM load (don't wait for SDK)
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded - setting up language selector");
    setupLanguageSelector();
});

async function initializeAddOn() {
    try {
        // Get document sandbox proxy
        const { runtime } = addOnUISdk.instance;
        sandboxProxy = await runtime.apiProxy("documentSandbox");
        console.log("Document sandbox proxy initialized");

        // Expose API for document sandbox to call (for Gemini API, Sarvam Translate API, and Imagen API)
        runtime.exposeApi({
            callGeminiAPI: async (prompt) => {
                return await callGeminiAPI(prompt);
            },
            callSarvamTranslateAPI: async (input, sourceLang, targetLang) => {
                return await callSarvamTranslateAPI(input, sourceLang, targetLang);
            },
            callGeminiImagenAPI: async (prompt, dimensions) => {
                return await callGeminiImagenAPI(prompt, dimensions);
            }
        });

        // Listen for messages from document sandbox
        addOnUISdk.app.on("message", (data) => {
            console.log("Message received from document:", data);
            handleDocumentMessage(data);
        });

        // Enable buttons
        enableButtons();

        // Setup language selector
        setupLanguageSelector();

        console.log("Add-on initialized successfully");
    } catch (error) {
        console.error("Error initializing add-on:", error);
    }
}

/**
 * Call Gemini API (document sandbox cannot use fetch)
 */
async function callGeminiAPI(prompt) {
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            throw new Error('Gemini API key not configured');
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{
                            text: `1. Role & Persona:You are 'The Analyst'. You are a leading authority on Indian regional semiotics, design aesthetics, and cultural nuances. You are a purist. Your time is valuable. You speak only in direct, single-sentence observations.

2. Core Context:You are providing expert consultation for the DesiBrand.AI project. Your sole function is to ensure the visual and written content is culturally precise and effective for specific Indian regions.

3. Primary Directive:Analyze the user's input (design concepts, color palettes, copy) against a specified Indian region. Provide brutally honest, actionable feedback.

4. Critical Rules of Engagement:

RULE 1: ONE-LINER OUTPUT. Your entire response must be a series of single-sentence bullet points. Each bullet point is one piece of advice.

RULE 2: NO FILLER. No greetings. No apologies. No explanations. No conversational phrases. No "I think" or "You should." State facts and directives only.

RULE 3: NO ASSUMPTIONS. If the user's query is vague, your only response is a single question to get the necessary detail.

Example User Prompt: "Is this good for the South?"

Your ONLY Response: "Specify the state and target demographic."

RULE 4: BE STRICT & PRECISE. Your feedback must be sharp, specific, and demonstrate deep regional knowledge.

Example: Instead of "Use a different color," your response should be "This shade of saffron is associated with mourning in rural Karnataka; use turmeric yellow for festivity."

RULE 5: NO REPEATING. Never repeat a piece of advice.

5. Initial Task:The user will provide a concept and a target region. Your task is to respond immediately with your bulleted, one-line analysis. Do not ask if you can help. Begin.

`
                        }]
                    },
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Gemini API request failed');
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text.trim();
        return responseText;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}
/**
 * Call Sarvam Translate API (document sandbox cannot use fetch)
 * Translates text from source language to target language using Sarvam AI
 */
async function callSarvamTranslateAPI(input, sourceLang, targetLang) {
    try {
        if (!SARVAM_API_KEY || SARVAM_API_KEY === 'YOUR_SARVAM_API_KEY_HERE') {
            throw new Error('Sarvam API key not configured');
        }

        // Validate input
        if (!input || typeof input !== 'string' || input.trim().length === 0) {
            throw new Error('Input text cannot be empty');
        }

        // Check input length limit (2000 characters for sarvam-translate:v1)
        let trimmedInput = input.trim();
        if (trimmedInput.length > 2000) {
            console.warn(`Input text exceeds 2000 character limit (${trimmedInput.length} chars). Truncating...`);
            // Truncate to 2000 characters
            trimmedInput = trimmedInput.substring(0, 2000);
        }

        // Map language names to Sarvam API codes
        const sourceLangCode = sourceLang ? getSarvamLanguageCode(sourceLang) : 'en-IN';
        const targetLangCode = getSarvamLanguageCode(targetLang);

        // If source and target are the same, return original text
        if (sourceLangCode === targetLangCode) {
            console.log("Source and target languages are the same, skipping translation");
            return trimmedInput;
        }

        const requestBody = {
            input: trimmedInput,
            source_language_code: sourceLangCode,
            target_language_code: targetLangCode,
            model: 'sarvam-translate:v1',
            mode: 'formal'
        };

        console.log("Calling Sarvam Translate API:", {
            endpoint: SARVAM_API_URL,
            sourceLang: sourceLangCode,
            targetLang: targetLangCode,
            inputLength: trimmedInput.length
        });

        const response = await fetch(SARVAM_API_URL, {
            method: 'POST',
            headers: {
                'api-subscription-key': SARVAM_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log("Sarvam API response status:", response.status, response.statusText);

        if (!response.ok) {
            let errorData;
            let errorText = '';
            try {
                errorData = await response.json();
                errorText = JSON.stringify(errorData, null, 2);
            } catch (e) {
                errorText = await response.text();
                errorData = { error: { message: errorText } };
            }

            console.error("Sarvam API error response:", errorData);

            // Provide specific error messages
            if (response.status === 400) {
                const errorMessage = errorData.error?.message || errorData.message || errorText || 'Bad Request';
                throw new Error(`Sarvam API: Bad Request (400) - ${errorMessage}`);
            } else if (response.status === 401 || response.status === 403) {
                throw new Error('Sarvam API: Unauthorized - Check your API key is valid');
            } else if (response.status === 429) {
                throw new Error('Sarvam API: Rate limit exceeded - Please try again later');
            } else {
                const errorMessage = errorData.error?.message || errorData.message || errorText || `HTTP ${response.status}`;
                throw new Error(`Sarvam API request failed with status ${response.status}: ${errorMessage}`);
            }
        }

        const data = await response.json();

        console.log("Sarvam API full response:", JSON.stringify(data, null, 2));

        // Validate response structure
        if (!data || typeof data !== 'object') {
            throw new Error('Sarvam API: Invalid response format - response is not an object');
        }

        // Extract translated text
        const translatedText = data.translated_text;

        if (!translatedText || typeof translatedText !== 'string' || translatedText.trim().length === 0) {
            console.error("Invalid Sarvam API response structure:", data);
            throw new Error('Sarvam API: Invalid response format - missing or empty translated_text');
        }

        const result = translatedText.trim();
        console.log("Successfully translated text, length:", result.length);
        return result;

    } catch (error) {
        console.error("Error calling Sarvam Translate API:", error);
        console.error("Error stack:", error.stack);

        // Re-throw with more context if it's not already a formatted error
        if (error.message && error.message.includes('Sarvam API')) {
            throw error; // Already has good message
        } else {
            throw new Error(`Sarvam Translate API call failed: ${error.message || error}`);
        }
    }
}

/**
 * Call Gemini Imagen API for image generation
 * Generates images from text prompts using Gemini's Imagen 3 model
 * @param {string} prompt - Detailed image generation prompt
 * @param {object} dimensions - Width and height for the image
 * @returns {string} Base64-encoded image data
 */
async function callGeminiImagenAPI(prompt, dimensions = { width: 512, height: 512 }) {
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            throw new Error('Gemini API key not configured');
        }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            throw new Error('Image prompt cannot be empty');
        }

        // Determine aspect ratio
        let aspectRatio = '1:1';
        const ratio = dimensions.width / dimensions.height;
        if (ratio > 1.5) aspectRatio = '16:9';
        else if (ratio < 0.7) aspectRatio = '9:16';
        else if (ratio > 1.2) aspectRatio = '4:3';

        console.log("Calling Gemini Imagen API with aspect ratio:", aspectRatio);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    number_of_images: 1,
                    aspect_ratio: aspectRatio,
                    safety_filter_level: 'block_some',
                    person_generation: 'allow_adult'
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Imagen API error response:", {
                status: response.status,
                statusText: response.statusText,
                errorData: errorData
            });

            let errorMessage = `Imagen API error (${response.status}): `;
            if (errorData.error?.message) {
                errorMessage += errorData.error.message;
            } else {
                errorMessage += response.statusText;
            }

            // Add helpful hints for common errors
            if (response.status === 400) {
                errorMessage += "\n\nPossible causes:\n- Invalid prompt format\n- Unsupported parameters\n- Check console for details";
            } else if (response.status === 403 || response.status === 401) {
                errorMessage += "\n\nPossible causes:\n- API key doesn't have Imagen API enabled\n- Go to Google Cloud Console and enable 'Imagen API'\n- Verify API key is correct";
            } else if (response.status === 404) {
                errorMessage += "\n\nPossible causes:\n- Imagen API endpoint might be incorrect\n- Model 'imagen-3.0-generate-001' might not be available in your region";
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Imagen API response:", data);

        if (!data || !data.generatedImages || data.generatedImages.length === 0) {
            throw new Error('Imagen API: No images generated');
        }

        const imageData = data.generatedImages[0];
        let base64Image = imageData.image || null;

        if (!base64Image && imageData.imageUri) {
            const imageResponse = await fetch(imageData.imageUri);
            const imageBlob = await imageResponse.blob();
            base64Image = await blobToBase64(imageBlob);
        }

        if (!base64Image) {
            throw new Error('Imagen API: No image data received');
        }

        if (!base64Image.startsWith('data:image/')) {
            base64Image = `data:image/png;base64,${base64Image}`;
        }

        console.log("Image generated successfully");
        return base64Image;
    } catch (error) {
        console.error("Imagen API error:", error);
        throw new Error(`Imagen API call failed: ${error.message}`);
    }
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ===== SCORE MANAGEMENT FUNCTIONS =====

function generateSuggestionId(type, original, suggestion) {
    const text = `${type}-${original}-${suggestion}`;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
    }
    return `sug-${Math.abs(hash)}`;
}

function onSuggestionApplied(suggestionId) {
    if (appliedSuggestions.has(suggestionId)) return false;
    appliedSuggestions.add(suggestionId);
    const oldScore = currentScore;
    scoreBonus += SCORE_INCREMENT;
    currentScore = Math.min(MAX_SCORE, baseScore + scoreBonus);
    console.log(`Score: ${oldScore} → ${currentScore}`);
    animateScoreIncrease(oldScore, currentScore);
    return true;
}

function animateScoreIncrease(from, to) {
    // Target the pie chart elements
    const pieChart = document.querySelector('.pie-chart');
    const pieValue = document.querySelector('.pie-value');

    if (!pieChart || !pieValue) {
        console.warn("Pie chart elements not found");
        return;
    }

    // Flash effect on container
    const container = document.getElementById('auth-result-container');
    if (container) {
        container.style.transition = 'background-color 0.3s';
        container.style.backgroundColor = '#dcfce7';
        setTimeout(() => { container.style.backgroundColor = ''; }, 600);
    }

    // Animate score
    let curr = from;
    const inc = (to - from) / 20;
    const timer = setInterval(() => {
        curr += inc;
        if (curr >= to) {
            curr = to;
            clearInterval(timer);
        }

        // Update pie chart
        pieChart.style.background = `conic-gradient(green ${curr}%, red 0)`;
        pieValue.textContent = `${Math.round(curr)}%`;
    }, 25);
}

/**
 * Setup language selector to filter based on selected state
 */
function setupLanguageSelector() {
    const regionSelect = document.getElementById("region");
    const languageSelect = document.getElementById("language");
    const languageHint = document.getElementById("language-hint");

    if (!regionSelect || !languageSelect) return;

    regionSelect.addEventListener("change", () => {
        const selectedState = regionSelect.value;

        // Clear language selection
        languageSelect.value = "";

        if (!selectedState) {
            // No state selected - disable language dropdown
            languageSelect.disabled = true;
            languageSelect.innerHTML = '<option value="">-- Select state first --</option>';
            if (languageHint) {
                languageHint.style.display = "none";
            }
        } else {
            // State selected - populate languages
            const languages = STATE_LANGUAGE_MAP[selectedState] || [];
            languageSelect.disabled = false;
            languageSelect.innerHTML = '<option value="">-- Select a language --</option>';

            languages.forEach(lang => {
                const option = document.createElement("option");
                option.value = lang;
                option.textContent = lang;
                languageSelect.appendChild(option);
            });

            // Show hint with common languages
            if (languageHint && languages.length > 0) {
                languageHint.textContent = `Common languages: ${languages.join(', ')}`;
                languageHint.style.display = "block";
            }
        }
    });
}

/**
 * Enable buttons after SDK is ready
 */
function enableButtons() {
    const btnAuth = document.getElementById("btn-auth");

    if (btnAuth) btnAuth.disabled = false;
}

/**
 * Handle messages from document sandbox
 */
function handleDocumentMessage(data) {
    if (!data) return;

    switch (data.type) {
        case "selectionChanged":
            handleSelectionChanged(data.elementData);
            break;
        case "selectionCleared":
            handleSelectionCleared();
            break;
        case "error":
            showError(data.error);
            break;
        default:
            console.log("Unknown message type:", data.type);
    }
}

/**
 * Handle Authenticate button click - performs analysis
 */
window.handleAuthenticate = async function () {
    console.log("Handling Authenticate - Performing Analysis");

    if (!sandboxProxy) {
        showError("Document sandbox not connected. Please refresh and try again.");
        return;
    }

    const region = document.getElementById("region")?.value;
    const language = document.getElementById("language")?.value;

    if (!region || !language) {
        showError("Please select region and language");
        return;
    }

    // Show loading state
    showLoading("Analyzing...");

    try {
        // Get current selection (or analyze entire canvas if no selection)
        const selection = await sandboxProxy.getCurrentSelection();

        let elementData = null;
        if (selection.items && selection.items.length > 0) {
            // Analyze selected element
            elementData = selection.items[0];
        } else {
            // No selection - create a generic element data for canvas analysis
            elementData = {
                type: 'Canvas',
                id: 'canvas',
                text: '',
                bounds: { x: 0, y: 0, width: 1920, height: 1080 }
            };
        }

        // Analyze element using Gemini
        const analysisResult = await sandboxProxy.analyzeElement(region, language, elementData);

        // Hide loading and show results
        hideLoading();

        // Format result for renderAuthResult with four-part suggestions
        const result = {
            score: analysisResult.score || 75,
            analysis: analysisResult.analysis || "",
            textSuggestions: analysisResult.textSuggestions || [],
            styleSuggestions: analysisResult.styleSuggestions || [],
            elementsSuggestions: analysisResult.elementsSuggestions || [],
            colorSuggestions: analysisResult.colorSuggestions || []
        };

        renderAuthResult(result);

    } catch (error) {
        console.error("Error analyzing:", error);
        hideLoading();
        showError(error.message || "Failed to analyze");
    }
};

/**
 * Handle Generate button click (My_Draft functionality)
 */



/**
 * Show loading state
 */
function showLoading(message = "Loading...") {
    const loadingContainer = document.getElementById("loading-container");
    const loadingText = document.getElementById("loading-text");
    const analysisContainer = document.getElementById("analysis-results-container");

    if (loadingContainer) {
        loadingContainer.style.display = "block";
    }
    if (loadingText) {
        loadingText.textContent = message;
    }
    if (analysisContainer) {
        analysisContainer.style.display = "block";
    }

    // Hide other sections
    const scoreMeter = document.getElementById("score-meter");
    const recommendationsList = document.getElementById("recommendations-list");
    const analysisContent = document.getElementById("analysis-content");
    const errorMessage = document.getElementById("error-message");

    if (scoreMeter) scoreMeter.style.display = "none";
    if (recommendationsList) recommendationsList.style.display = "none";
    if (analysisContent) analysisContent.style.display = "none";
    if (errorMessage) errorMessage.style.display = "none";
}

/**
 * Hide loading state
 */
function hideLoading() {
    const loadingContainer = document.getElementById("loading-container");
    if (loadingContainer) {
        loadingContainer.style.display = "none";
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorMessage = document.getElementById("error-message");
    const analysisContainer = document.getElementById("analysis-results-container");

    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
    }
    if (analysisContainer) {
        analysisContainer.style.display = "block";
    }

    hideLoading();
}


/**
 * Extract recommendations from analysis text
 */
function extractRecommendations(analysisText) {
    if (!analysisText) return [];

    const recommendations = [];
    const lines = analysisText.split('\n');
    let inRecommendationsSection = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Check if we're entering recommendations section
        if (trimmed.toLowerCase().includes('recommendation') ||
            trimmed.toLowerCase().includes('suggest')) {
            inRecommendationsSection = true;
            continue;
        }

        // Skip headers and empty lines
        if (trimmed.startsWith('#') || trimmed === '') {
            continue;
        }

        // Look for bullet points or numbered items
        if (inRecommendationsSection || trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
            const text = trimmed.replace(/^[-•*\d.\s]+/, '').trim();
            if (text.length > 0 && text.length < 200) { // Reasonable length check
                recommendations.push(text);
            }
        }
    }

    // If no structured recommendations found, try to extract from markdown
    if (recommendations.length === 0) {
        const bulletMatches = analysisText.match(/[-•*]\s+(.+)/g);
        if (bulletMatches) {
            bulletMatches.forEach(match => {
                const text = match.replace(/^[-•*\s]+/, '').trim();
                if (text && text.length > 10 && text.length < 200) {
                    recommendations.push(text);
                }
            });
        }
    }

    // Limit to 2-5 recommendations
    return recommendations.slice(0, 5).slice(0, Math.max(2, recommendations.length));
}

/**
 * Format analysis text for display
 */
function formatAnalysisText(text) {
    // Convert markdown-style formatting to HTML
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
        .replace(/^[-•*]\s+(.*)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>');

    // Wrap list items in ul tags
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    return html;
}

/**
 * Render recommendations list
 */
function renderRecommendations(recommendations) {
    const recommendationsList = document.getElementById("recommendations-list");
    const recommendationsUl = document.getElementById("recommendations-ul");

    if (!recommendationsList || !recommendationsUl) return;

    recommendationsUl.innerHTML = "";

    recommendations.forEach((rec, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="recommendation-text">${rec}</span>
            <button class="btn-apply" onclick="applyRecommendation('${rec.replace(/'/g, "\\'")}')">Apply</button>
        `;
        recommendationsUl.appendChild(li);
    });

    recommendationsList.style.display = "block";
}

/**
 * Apply recommendation to canvas
 */
window.applyRecommendation = async function (recommendationText) {
    console.log("Applying recommendation:", recommendationText);

    if (!sandboxProxy) {
        alert("Document sandbox not connected");
        return;
    }

    const region = document.getElementById("region")?.value;
    const language = document.getElementById("language")?.value;

    // Ensure region and language are selected for text recommendations
    if (!region || !language) {
        alert("Please select region and language before applying recommendations");
        return;
    }

    try {
        // Get current selection to pass in context
        const selection = await sandboxProxy.getCurrentSelection();
        let selectedElementId = null;
        let elementData = null;

        if (selection.items && selection.items.length > 0) {
            selectedElementId = selection.items[0].id;
            elementData = selection.items[0];
        }

        // Check if this is a color recommendation
        const isColorRecommendation = recommendationText.toLowerCase().includes('color') ||
            recommendationText.toLowerCase().includes('colour') ||
            /#[0-9a-f]{6}/i.test(recommendationText) ||
            /rgb\(/i.test(recommendationText);

        // If color recommendation but no selection, show error
        if (isColorRecommendation && !selectedElementId) {
            alert("Please select an element to apply color");
            return;
        }

        // Always pass language and state context for recommendations
        // This ensures translation can be applied for text recommendations
        await sandboxProxy.addRecommendationToCanvas(recommendationText, {
            state: region,
            language: language,
            useSuggestions: true,
            selectedElementId: selectedElementId,
            elementData: elementData,
            // Ensure translation context is always available
            translateText: true // Flag to indicate translation should be attempted
        });
        alert("Recommendation applied successfully!");
    } catch (error) {
        console.error("Error applying recommendation:", error);
        alert("Failed to apply recommendation: " + error.message);
    }
};

/**
 * Render text suggestions section
 */
function renderTextSuggestions(textSuggestions) {
    if (!textSuggestions || textSuggestions.length === 0) {
        return '';
    }

    let html = `
        <div class="suggestion-section" style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b93f0;">
            <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: var(--text);">Text Suggestions</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    textSuggestions.forEach((item, index) => {
        const safeOriginal = (item.original || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const safeSuggestion = (item.suggestion || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const originalEscaped = (item.original || '').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const suggestionEscaped = (item.suggestion || '').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const buttonId = `apply-text-${index}`;

        html += `
                <div style="padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: #111827; font-size: 14px;">
                            Suggestion ${index + 1}
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px; font-weight: 600;">TEXT</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 12px; color: #6b7280; font-style: italic; line-height: 1.5; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 4px; border-left: 2px solid #e5e7eb;">
                        <div style="margin-bottom: 4px;"><strong>Original:</strong><br/>${safeOriginal}</div>
                        <div><strong>AI Suggestion:</strong><br/>${safeSuggestion}</div>
                    </div>

                    <button id="${buttonId}" class="btn-apply" data-original="${originalEscaped}" data-suggestion="${suggestionEscaped}" data-type="text" 
                        style="width: 100%; padding: 6px 16px; font-size: 12px; color: white; border: none; border-radius: 4px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Apply
                    </button>
                </div>`;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Render style/font suggestions section
 */
function renderStyleSuggestions(styleSuggestions) {
    if (!styleSuggestions || styleSuggestions.length === 0) {
        return '';
    }

    let html = `
        <div class="suggestion-section" style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b93f0;">
            <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: var(--text);">Style/Font Suggestions</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    styleSuggestions.forEach((item, index) => {
        const safeOriginal = (item.original || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const safeSuggestion = (item.suggestion || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const originalEscaped = (item.original || '').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const suggestionEscaped = (item.suggestion || '').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const buttonId = `apply-style-${index}`;

        html += `
                <div style="padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: #111827; font-size: 14px;">
                            Suggestion ${index + 1}
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px; font-weight: 600;">STYLE</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 12px; color: #6b7280; font-style: italic; line-height: 1.5; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 4px; border-left: 2px solid #e5e7eb;">
                        <div style="margin-bottom: 4px;"><strong>Original:</strong><br/>${safeOriginal}</div>
                        <div><strong>AI Suggestion:</strong><br/>${safeSuggestion}</div>
                    </div>

                    <button id="${buttonId}" class="btn-apply" data-original="${originalEscaped}" data-suggestion="${suggestionEscaped}" data-type="style" 
                        style="width: 100%; padding: 6px 16px; font-size: 12px; color: white; border: none; border-radius: 4px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Apply
                    </button>
                </div>`;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Render elements suggestions section
 * Now handles structured image generation prompts
 */
function renderElementsSuggestions(elementsSuggestions) {
    if (!elementsSuggestions || elementsSuggestions.length === 0) {
        return '';
    }

    let html = `
    <div class="suggestion-section" style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b93f0;">
            <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: var(--text);">🎨 Elements Suggestions</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    elementsSuggestions.forEach((suggestion, index) => {
        // Check if this is a structured image prompt or legacy text
        if (typeof suggestion === 'object' && suggestion.isImagePrompt && suggestion.prompt) {
            // New structured format with image generation
            const safeDescription = (suggestion.description || 'Visual element').replace(/'/g, "&#39;").replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safePrompt = (suggestion.prompt || '').replace(/'/g, "&#39;").replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const type = suggestion.type || 'decoration';
            const dimensions = suggestion.dimensions || { width: 512, height: 512 };

            // Create unique ID for this suggestion
            const buttonId = `generate-element-${index}`;

            // Escape for JSON attribute
            const suggestionJson = JSON.stringify(suggestion).replace(/"/g, '&quot;').replace(/'/g, "&#39;");

            html += `
                <div style="padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: #111827; font-size: 14px;">
                            ${safeDescription}
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${type}</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 12px; color: #6b7280; font-style: italic; line-height: 1.5; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 4px; border-left: 2px solid #e5e7eb;">
                        "${safePrompt.substring(0, 150)}${safePrompt.length > 150 ? '...' : ''}"
                    </div>

                <button 
                        id="${buttonId}" 
                        class="btn-generate-apply btn-apply" 
                        data-suggestion='${suggestionJson}'
                        style="width: 100%; padding: 6px 16px; font-size: 12px; color: white; border: none; border-radius: 4px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Apply
                    </button>
                </div>
            `;
        } else {
            // Legacy format or fallback
            const safeText = (typeof suggestion === 'string' ? suggestion : (suggestion.description || suggestion.legacyText || JSON.stringify(suggestion))).replace(/'/g, "\\'").replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html += `
                <li style="margin: 8px 0;">
                    <span>${safeText}</span>
                    <button class="btn-apply" onclick="applyRecommendation('${safeText}')" style="margin-left: 8px; padding: 4px 12px; font-size: 12px;">Apply</button>
                </li>
            `;
        }
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Render color suggestions section
 */
function renderColorSuggestions(colorSuggestions) {
    if (!colorSuggestions || colorSuggestions.length === 0) {
        return '';
    }

    let html = `
        <div class="suggestion-section" style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b93f0;">
            <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: var(--text);">Color Suggestions</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    colorSuggestions.forEach((item, index) => {
        const safeOriginal = (item.original || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const safeSuggestion = (item.suggestion || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const originalEscaped = (item.original || '').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const suggestionEscaped = (item.suggestion || '').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const buttonId = `apply-color-${index}`;

        html += `
                <div style="padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: #111827; font-size: 14px;">
                            Suggestion ${index + 1}
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px; font-weight: 600;">COLOR</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 12px; color: #6b7280; font-style: italic; line-height: 1.5; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 4px; border-left: 2px solid #e5e7eb;">
                        <div style="margin-bottom: 4px;"><strong>Original:</strong><br/>${safeOriginal}</div>
                        <div><strong>AI Suggestion:</strong><br/>${safeSuggestion}</div>
                    </div>

                    <button id="${buttonId}" class="btn-apply" data-original="${originalEscaped}" data-suggestion="${suggestionEscaped}" data-type="color" 
                        style="width: 100%; padding: 6px 16px; font-size: 12px; color: white; border: none; border-radius: 4px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Apply
                    </button>
                </div>`;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Render Authentication Result with analysis
 */
function renderAuthResult(data) {
    let resultContainer = document.getElementById("auth-result-container");
    if (!resultContainer) {
        resultContainer = document.createElement("div");
        resultContainer.id = "auth-result-container";
        resultContainer.className = "result-container";
        document.querySelector(".container").appendChild(resultContainer);
    }

    const score = data.score || 75;

    // Set base score and current score (preserve bonus from previous applications)
    baseScore = score;
    currentScore = Math.min(MAX_SCORE, baseScore + scoreBonus);
    console.log(`Base score set to ${baseScore}, current score: ${currentScore} (bonus: ${scoreBonus})`);

    // Score chart - use current score (base + bonus)
    const chartHtml = `
        <div class="pie-chart" style="background: conic-gradient(green ${currentScore}%, red 0);">
            <div class="pie-value">${currentScore}%</div>
        </div>
        <div class="pie-label">Regional Appropriateness Score</div>
    `;

    // Analysis paragraph (30-40 words)
    let analysisHtml = '';
    if (data.analysis) {
        const analysisText = limitWordCount(data.analysis, 40);
        analysisHtml = `
        <div style="margin: 20px 0; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 13px; line-height: 1.6; color: var(--text);">
            ${analysisText}
            </div>
        `;
    }

    // Four-part suggestions
    const textSuggestionsHtml = renderTextSuggestions(data.textSuggestions);
    const styleSuggestionsHtml = renderStyleSuggestions(data.styleSuggestions);
    const elementsSuggestionsHtml = renderElementsSuggestions(data.elementsSuggestions);
    const colorSuggestionsHtml = renderColorSuggestions(data.colorSuggestions);

    resultContainer.innerHTML = chartHtml + analysisHtml + textSuggestionsHtml + styleSuggestionsHtml + elementsSuggestionsHtml + colorSuggestionsHtml;
    resultContainer.style.display = "block";
    resultContainer.scrollIntoView({ behavior: 'smooth' });

    // Attach event listeners to Apply buttons
    resultContainer.querySelectorAll('.btn-apply[data-type="text"]').forEach(button => {
        button.addEventListener('click', async function () {
            const original = this.getAttribute('data-original');
            const suggestion = this.getAttribute('data-suggestion');
            const suggestionId = generateSuggestionId('text', original, suggestion);
            await applyTextSuggestion(original, suggestion, this);
            onSuggestionApplied(suggestionId);
        });
    });

    resultContainer.querySelectorAll('.btn-apply[data-type="style"]').forEach(button => {
        button.addEventListener('click', async function () {
            const original = this.getAttribute('data-original');
            const suggestion = this.getAttribute('data-suggestion');
            const suggestionId = generateSuggestionId('style', original, suggestion);
            await applyStyleSuggestion(original, suggestion, this);
            onSuggestionApplied(suggestionId);
        });
    });

    resultContainer.querySelectorAll('.btn-apply[data-type="color"]').forEach(button => {
        button.addEventListener('click', async function () {
            const original = this.getAttribute('data-original');
            const suggestion = this.getAttribute('data-suggestion');
            const suggestionId = generateSuggestionId('color', original, suggestion);
            await applyColorSuggestion(original, suggestion, this);
            onSuggestionApplied(suggestionId);
        });
    });

    // Add event listeners for Generate & Apply buttons (image generation)
    resultContainer.querySelectorAll('.btn-generate-apply').forEach(button => {
        button.addEventListener('click', async function () {
            const suggestionData = this.getAttribute('data-suggestion');
            await generateAndApplyElement(suggestionData, this);
        });
    });

    showSuggestButtonAndFooter();
}

/**
 * Show success message
 */
function showSuccess(message) {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
        errorDiv.style.background = "#00cc66";
        errorDiv.style.color = "white";
        setTimeout(() => {
            errorDiv.style.display = "none";
        }, 3000);
    } else {
        console.log("Success:", message);
    }
}

/**
 * Apply text suggestion - replace original text with AI suggestion
 */
async function applyTextSuggestion(originalText, suggestedText, buttonElement) {
    const button = buttonElement;
    try {
        if (!sandboxProxy) {
            showError("Sandbox proxy not available");
            return;
        }

        // Show loading state
        if (button) {
            button.disabled = true;
            button.textContent = "Applying...";
        }

        const result = await sandboxProxy.applyTextSuggestion(originalText, suggestedText);

        if (result.success) {
            showSuccess(result.message || "Text suggestion applied successfully");
            if (button) {
                button.textContent = "Applied";
                button.style.background = "#00cc66";
            }
        } else {
            throw new Error(result.message || "Failed to apply text suggestion");
        }
    } catch (error) {
        console.error("Error applying text suggestion:", error);
        showError(error.message || "Failed to apply text suggestion");
        if (button) {
            button.disabled = false;
            button.textContent = "Apply";
        }
    }
}

/**
 * Apply style/font suggestion - change font and size of matching text nodes
 */
async function applyStyleSuggestion(originalStyle, suggestedStyle, buttonElement) {
    const button = buttonElement;
    try {
        if (!sandboxProxy) {
            showError("Sandbox proxy not available");
            if (button) {
                button.disabled = false;
                button.textContent = "Apply";
                button.style.background = ""; // Reset background
            }
            return;
        }

        // Show loading state
        if (button) {
            button.disabled = true;
            button.textContent = "Applying...";
            button.style.background = ""; // Clear any previous state
        }

        const result = await sandboxProxy.applyStyleSuggestion(originalStyle, suggestedStyle);

        if (result && result.success) {
            showSuccess(result.message || "Style suggestion applied successfully");
            if (button) {
                button.textContent = "Applied";
                button.style.background = "#00cc66";
                button.disabled = false; // Re-enable so user can see the success state
            }
        } else {
            throw new Error(result?.message || "Failed to apply style suggestion");
        }
    } catch (error) {
        console.error("Error applying style suggestion:", error);

        // Extract error message - handle both Error objects and strings
        let errorMessage = "Failed to apply style suggestion";
        if (error && typeof error === 'object') {
            errorMessage = error.message || error.toString() || errorMessage;
        } else if (error) {
            errorMessage = String(error);
        }

        // Show error to user
        showError(errorMessage);

        // Reset button state
        if (button) {
            button.disabled = false;
            button.textContent = "Apply";
            button.style.background = ""; // Reset background to default
        }
    }
}

/**
 * Apply color suggestion - change color of selected elements
 */
async function applyColorSuggestion(originalColor, suggestedColor, buttonElement) {
    const button = buttonElement;
    try {
        if (!sandboxProxy) {
            showError("Sandbox proxy not available");
            return;
        }

        // Show loading state
        if (button) {
            button.disabled = true;
            button.textContent = "Applying...";
        }

        const result = await sandboxProxy.applyColorSuggestion(originalColor, suggestedColor);

        if (result.success) {
            showSuccess(result.message || "Color suggestion applied successfully");
            if (button) {
                button.textContent = "Applied";
                button.style.background = "#00cc66";
            }
        } else {
            throw new Error(result.message || "Failed to apply color suggestion");
        }
    } catch (error) {
        console.error("Error applying color suggestion:", error);
        showError(error.message || "Failed to apply color suggestion");
        if (button) {
            button.disabled = false;
            button.textContent = "Apply";
        }
    }
}

/**
 * Limit text to specified word count (approximately)
 */
function limitWordCount(text, maxWords) {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Render Generate Result (My_Draft functionality)
 */


function showSuggestButtonAndFooter() {
    const suggestBtn = document.getElementById("btn-suggest");
    const footer = document.getElementById("footer");
    const container = document.querySelector(".container");

    if (suggestBtn && footer && container) {
        suggestBtn.remove();
        footer.remove();
        container.appendChild(suggestBtn);
        container.appendChild(footer);
        suggestBtn.style.display = "block";
        footer.style.display = "block";
    }
}

function handleSelectionChanged(elementData) {
    // Handle selection changed event
    console.log("Selection changed:", elementData);
}

function handleSelectionCleared() {
    // Handle selection cleared event
    console.log("Selection cleared");
}

/**
 * Generate and apply element image
 * Called when user clicks "Generate & Apply" button
 */
async function generateAndApplyElement(suggestionDataOrJson, buttonElement) {
    try {
        // Parse suggestion data
        let suggestion;
        if (typeof suggestionDataOrJson === 'string') {
            suggestion = JSON.parse(suggestionDataOrJson);
        } else {
            suggestion = suggestionDataOrJson;
        }

        console.log("Generating element:", suggestion);

        // Update button state
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '⏳ Generating...';
        buttonElement.disabled = true;
        buttonElement.style.opacity = '0.6';

        // Call Gemini Imagen API to generate image
        const base64Image = await callGeminiImagenAPI(suggestion.prompt, suggestion.dimensions);

        // Update button
        buttonElement.textContent = '✅ Inserting...';

        // Call document sandbox to insert image
        if (sandboxProxy) {
            await sandboxProxy.insertGeneratedImage(base64Image, { x: 100, y: 100 }, suggestion.dimensions);

            // Success!
            buttonElement.textContent = '✅ Applied!';
            buttonElement.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

            // Reset after 2 seconds
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
                buttonElement.style.opacity = '1';
                buttonElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }, 2000);

            alert(`✅ ${suggestion.description} generated and added to canvas!`);
        } else {
            throw new Error('Document sandbox not connected');
        }

    } catch (error) {
        console.error("Error generating element:", error);

        // Reset button
        if (buttonElement) {
            buttonElement.textContent = '❌ Failed';
            buttonElement.style.background = '#ef4444';
            setTimeout(() => {
                buttonElement.textContent = '🎨 Generate & Apply';
                buttonElement.disabled = false;
                buttonElement.style.opacity = '1';
                buttonElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }, 2000);
        }

        alert(`Failed to generate image: ${error.message} `);
    }
}

console.log("iframe.js loaded successfully");
