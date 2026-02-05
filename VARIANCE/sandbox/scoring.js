/**
 * Regional Appropriateness Scoring System
 * Provides deterministic scoring based on design analysis
 */

// Regional color palettes (hex codes)
export const REGIONAL_COLORS = {
    'Tamil Nadu': ['#FF9933', '#DC143C', '#FFD700', '#228B22', '#800020'],
    'Maharashtra': ['#FF9933', '#800020', '#FFD700', '#8B4513'],
    'Delhi': ['#FF9933', '#000080', '#FFFFFF', '#FFD700'],
    'Karnataka': ['#FF0000', '#FFD700', '#228B22'],
    'Kerala': ['#FFD700', '#228B22', '#800020', '#FFFFFF'],
    'Gujarat': ['#FF9933', '#228B22', '#FFD700', '#DC143C'],
    'Rajasthan': ['#FF9933', '#DC143C', '#FFD700', '#FF1493'],
    'West Bengal': ['#DC143C', '#FFD700', '#FFFFFF'],
    'Punjab': ['#FF9933', '#228B22', '#FFD700'],
    'Andhra Pradesh': ['#FFD700', '#DC143C', '#228B22']
};

// Regional cultural keywords
export const REGIONAL_KEYWORDS = {
    'Tamil Nadu': ['kolam', 'pongal', 'temple', 'tamil', 'chennai', 'meenakshi', 'tanjore', 'bharatanatyam'],
    'Maharashtra': ['warli', 'ganesh', 'mumbai', 'marathi', 'pune', 'gateway', 'lavani', 'diwali'],
    'Delhi': ['india gate', 'lotus temple', 'red fort', 'delhi', 'qutub', 'connaught'],
    'Karnataka': ['mysore', 'bangalore', 'hampi', 'kannada', 'dasara', 'karnataka'],
    'Kerala': ['kathakali', 'onam', 'backwaters', 'kerala', 'kochi', 'ayurveda', 'snake boat'],
    'Gujarat': ['garba', 'navratri', 'ahmedabad', 'gujarati', 'dandiya', 'rann'],
    'Rajasthan': ['jaipur', 'hawa mahal', 'rajasthani', 'camel', 'desert', 'mehendi'],
    'West Bengal': ['durga puja', 'kolkata', 'bengali', 'howrah', 'victoria', 'rosogolla'],
    'Punjab': ['bhangra', 'golden temple', 'punjabi', 'amritsar', 'vaisakhi'],
    'Andhra Pradesh': ['hyderabad', 'charminar', 'telugu', 'tirupati', 'biryani']
};

/**
 * Calculate Regional Appropriateness Score
 * @param {object} elementData - Extracted element data
 * @param {string} state - Target state
 * @param {string} language - Target language
 * @returns {number} Score from 0-100
 */
export function calculateScore(elementData, state, language) {
    let totalScore = 0;

    // 1. Language Appropriateness (30 points)
    totalScore += scoreLanguage(elementData, language);

    // 2. Cultural Elements (25 points)
    totalScore += scoreCulturalElements(elementData, state);

    // 3. Color Palette (20 points)
    totalScore += scoreColors(elementData, state);

    // 4. Typography (15 points)
    totalScore += scoreTypography(elementData, language);

    // 5. Content Relevance (10 points)
    totalScore += scoreContent(elementData, state);

    return Math.min(100, Math.max(0, Math.round(totalScore)));
}

/**
 * Score language appropriateness (30 points max)
 */
function scoreLanguage(elementData, targetLanguage) {
    const texts = extractAllText(elementData);
    if (!texts || texts.length === 0) return 15; // Neutral for no text

    let regionalTextCount = 0;
    let englishTextCount = 0;
    let totalTexts = texts.length;

    for (const text of texts) {
        if (isInRegionalLanguage(text, targetLanguage)) {
            regionalTextCount++;
        } else if (isEnglish(text)) {
            englishTextCount++;
        }
    }

    const regionalRatio = regionalTextCount / totalTexts;

    if (regionalRatio > 0.8) return 30; // Mostly regional
    if (regionalRatio > 0.5) return 25; // Good mix
    if (regionalRatio > 0.2) return 20; // Some regional
    if (englishTextCount === totalTexts) return 10; // English only
    return 5; // Mixed/unclear
}

/**
 * Score cultural elements (25 points max)
 */
function scoreCulturalElements(elementData, state) {
    const keywords = REGIONAL_KEYWORDS[state] || [];
    const allText = extractAllText(elementData).join(' ').toLowerCase();

    let matchCount = 0;
    for (const keyword of keywords) {
        if (allText.includes(keyword.toLowerCase())) {
            matchCount++;
        }
    }

    if (matchCount >= 4) return 25; // Highly cultural
    if (matchCount >= 3) return 20;
    if (matchCount >= 2) return 15;
    if (matchCount >= 1) return 10;
    return 5; // Neutral
}

/**
 * Score color palette (20 points max)
 */
function scoreColors(elementData, state) {
    const regionalColors = REGIONAL_COLORS[state] || [];
    const usedColors = extractColors(elementData);

    if (!usedColors || usedColors.length === 0) return 10; // Neutral

    let matchCount = 0;
    for (const color of usedColors) {
        if (isColorInPalette(color, regionalColors)) {
            matchCount++;
        }
    }

    const matchRatio = matchCount / usedColors.length;

    if (matchRatio > 0.7) return 20; // Strong match
    if (matchRatio > 0.5) return 16;
    if (matchRatio > 0.3) return 12;
    if (matchRatio > 0.1) return 8;
    return 5; // Weak match
}

/**
 * Score typography (15 points max)
 */
function scoreTypography(elementData, language) {
    const fonts = extractFonts(elementData);

    if (!fonts || fonts.length === 0) return 8; // Neutral

    let score = 0;

    // Check for regional script fonts
    const hasRegionalScript = fonts.some(font =>
        isRegionalFont(font, language)
    );

    if (hasRegionalScript) {
        score += 10;
    }

    // Check for readable fonts
    const hasReadableFonts = fonts.some(font =>
        isReadableFont(font)
    );

    if (hasReadableFonts) {
        score += 5;
    }

    return Math.min(15, score);
}

/**
 * Score content relevance (10 points max)
 */
function scoreContent(elementData, state) {
    const allText = extractAllText(elementData).join(' ').toLowerCase();
    const keywords = REGIONAL_KEYWORDS[state] || [];

    // Check for regional festivals/locations
    const hasRegionalContent = keywords.some(keyword =>
        allText.includes(keyword.toLowerCase())
    );

    if (hasRegionalContent) return 10;

    // Check for generic Indian content
    const indianKeywords = ['india', 'diwali', 'festival', 'celebration'];
    const hasIndianContent = indianKeywords.some(keyword =>
        allText.includes(keyword)
    );

    if (hasIndianContent) return 7;

    return 3; // Generic content
}

// Helper functions

function extractAllText(elementData) {
    const texts = [];

    if (elementData.text) {
        texts.push(elementData.text);
    }

    if (elementData.textElements && Array.isArray(elementData.textElements)) {
        elementData.textElements.forEach(el => {
            if (el.text) texts.push(el.text);
        });
    }

    return texts;
}

function extractColors(elementData) {
    const colors = [];

    if (elementData.color) {
        colors.push(elementData.color);
    }

    if (elementData.colors && Array.isArray(elementData.colors)) {
        elementData.colors.forEach(c => {
            if (c.color) colors.push(c.color);
        });
    }

    return colors;
}

function extractFonts(elementData) {
    const fonts = [];

    if (elementData.font) {
        fonts.push(elementData.font);
    }

    if (elementData.fontStyles && Array.isArray(elementData.fontStyles)) {
        elementData.fontStyles.forEach(fs => {
            if (fs.font) fonts.push(fs.font);
        });
    }

    return fonts;
}

function isInRegionalLanguage(text, language) {
    // Simple heuristic: check for non-Latin characters
    const hasNonLatin = /[^\u0000-\u007F]/.test(text);

    // Language-specific checks
    if (language === 'Hindi' || language === 'Marathi') {
        return /[\u0900-\u097F]/.test(text); // Devanagari
    } else if (language === 'Tamil') {
        return /[\u0B80-\u0BFF]/.test(text); // Tamil
    } else if (language === 'Telugu') {
        return /[\u0C00-\u0C7F]/.test(text); // Telugu
    } else if (language === 'Kannada') {
        return /[\u0C80-\u0CFF]/.test(text); // Kannada
    } else if (language === 'Malayalam') {
        return /[\u0D00-\u0D7F]/.test(text); // Malayalam
    } else if (language === 'Bengali') {
        return /[\u0980-\u09FF]/.test(text); // Bengali
    } else if (language === 'Gujarati') {
        return /[\u0A80-\u0AFF]/.test(text); // Gujarati
    } else if (language === 'Punjabi') {
        return /[\u0A00-\u0A7F]/.test(text); // Gurmukhi
    }

    return hasNonLatin;
}

function isEnglish(text) {
    // Check if text is primarily Latin characters
    const latinRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
    return latinRatio > 0.7;
}

function isColorInPalette(color, palette) {
    const colorHex = normalizeColor(color);

    for (const paletteColor of palette) {
        if (areColorsSimilar(colorHex, paletteColor)) {
            return true;
        }
    }

    return false;
}

function normalizeColor(color) {
    if (typeof color === 'string') {
        return color.toUpperCase();
    }
    return color;
}

function areColorsSimilar(color1, color2, threshold = 40) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return false;

    const distance = Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );

    return distance < threshold;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function isRegionalFont(font, language) {
    const regionalFonts = {
        'Hindi': ['Devanagari', 'Noto Sans Devanagari', 'Mangal'],
        'Tamil': ['Tamil', 'Noto Sans Tamil', 'Lohit Tamil'],
        'Telugu': ['Telugu', 'Noto Sans Telugu'],
        'Kannada': ['Kannada', 'Noto Sans Kannada'],
        'Malayalam': ['Malayalam', 'Noto Sans Malayalam'],
        'Bengali': ['Bengali', 'Noto Sans Bengali'],
        'Gujarati': ['Gujarati', 'Noto Sans Gujarati'],
        'Punjabi': ['Gurmukhi', 'Noto Sans Gurmukhi']
    };

    const fonts = regionalFonts[language] || [];
    return fonts.some(rf => font.includes(rf));
}

function isReadableFont(font) {
    const readableFonts = ['Arial', 'Helvetica', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins'];
    return readableFonts.some(rf => font.includes(rf));
}
