/**
 * image-generation-config.js
 * Configuration for Gemini Imagen API image generation
 */

/**
 * Image Generation Configuration
 * Centralized settings for Gemini Imagen API integration
 */
export const IMAGE_GENERATION_CONFIG = {
    // Gemini Imagen model selection
    model: 'imagen-3.0-generate-001', // High quality (can switch to 'imagen-3.0-fast-generate-001' for speed)
    
    // Default image dimensions
    defaultDimensions: {
        icon: { width: 256, height: 256 },
        pattern: { width: 512, height: 512 },
        decoration: { width: 384, height: 384 },
        background: { width: 1024, height: 1024 },
        illustration: { width: 512, height: 512 }
    },
    
    // API constraints
    maxPromptLength: 2000,
    maxImagesPerRequest: 1,
    
    // Supported element types
    supportedTypes: ['icon', 'pattern', 'decoration', 'background', 'illustration'],
    
    // Regional style guidelines for Indian states
    // These are used to enhance prompts with culturally appropriate elements
    regionalStyles: {
        'Andhra Pradesh': {
            colors: 'turmeric yellow, vermillion red, deep green',
            patterns: 'Kondapalli toy motifs, Kalamkari patterns, rangoli designs',
            symbols: 'lotus, peacock, temple gopuram',
            style: 'traditional South Indian art style'
        },
        'Arunachal Pradesh': {
            colors: 'earth tones, forest green, tribal red',
            patterns: 'tribal geometric patterns, woven textile designs',
            symbols: 'sun motifs, mountain silhouettes, traditional masks',
            style: 'tribal art style'
        },
        'Assam': {
            colors: 'deep red, golden yellow, white',
            patterns: 'Assamese gamosa patterns, bihu dance motifs',
            symbols: 'rhino, tea leaves, traditional jewelry',
            style: 'Assamese traditional art'
        },
        'Bihar': {
            colors: 'earthy red, turmeric yellow, black',
            patterns: 'Madhubani art patterns, geometric folk designs',
            symbols: 'peacock, fish, lotus, sun and moon',
            style: 'Madhubani folk art style'
        },
        'Chhattisgarh': {
            colors: 'tribal red, black, white',
            patterns: 'tribal art patterns, Bastar art motifs',
            symbols: 'tribal dancers, nature elements, folk symbols',
            style: 'tribal folk art'
        },
        'Goa': {
            colors: 'coastal blue, sandy beige, tropical green',
            patterns: 'Portuguese tile patterns, coastal motifs',
            symbols: 'coconut palms, fishing boats, church architecture',
            style: 'coastal Indo-Portuguese style'
        },
        'Gujarat': {
            colors: 'vibrant red, yellow, green, mirror work silver',
            patterns: 'Bandhani tie-dye patterns, Patola geometric designs, mirror work',
            symbols: 'peacock, elephant, traditional dandiya sticks',
            style: 'Gujarati folk art with mirror embellishments'
        },
        'Haryana': {
            colors: 'mustard yellow, earthy brown, vibrant red',
            patterns: 'phulkari embroidery patterns, folk geometric designs',
            symbols: 'traditional jewelry, agricultural motifs',
            style: 'North Indian folk art'
        },
        'Himachal Pradesh': {
            colors: 'mountain blue, snow white, pine green',
            patterns: 'Pahari miniature patterns, Himalayan motifs',
            symbols: 'mountain peaks, pine trees, temple architecture',
            style: 'Pahari art style'
        },
        'Jharkhand': {
            colors: 'tribal red, black, white, earth tones',
            patterns: 'Sohrai art patterns, tribal geometric designs',
            symbols: 'tribal dancers, nature spirits, forest animals',
            style: 'tribal folk art'
        },
        'Karnataka': {
            colors: 'red, yellow, sandalwood beige',
            patterns: 'Mysore painting patterns, temple architecture motifs',
            symbols: 'lotus, elephant, Ganesha symbols, sandalwood',
            style: 'Mysore traditional art style'
        },
        'Kerala': {
            colors: 'deep green, golden yellow, temple red',
            patterns: 'Kathakali face patterns, mural art designs, boat race motifs',
            symbols: 'coconut palm, snake boat, Kathakali mask, elephant',
            style: 'Kerala mural art style'
        },
        'Madhya Pradesh': {
            colors: 'earthy red, black, white, yellow',
            patterns: 'Gond art patterns, tribal geometric designs',
            symbols: 'peacock, trees, tribal symbols',
            style: 'Gond tribal art style'
        },
        'Maharashtra': {
            colors: 'saffron orange, green, yellow',
            patterns: 'Warli art patterns, geometric tribal designs',
            symbols: 'Warli figures, peacock, traditional jewelry',
            style: 'Warli folk art style'
        },
        'Manipur': {
            colors: 'vibrant red, green, yellow',
            patterns: 'traditional dance motifs, woven textile patterns',
            symbols: 'Manipuri dance poses, traditional pottery',
            style: 'Manipuri traditional art'
        },
        'Meghalaya': {
            colors: 'forest green, earth tones, tribal red',
            patterns: 'Khasi weaving patterns, tribal geometric designs',
            symbols: 'traditional baskets, rain motifs, living root bridges',
            style: 'tribal art style'
        },
        'Mizoram': {
            colors: 'tribal red, black, white',
            patterns: 'traditional weaving patterns, geometric tribal designs',
            symbols: 'bamboo, traditional hats, tribal symbols',
            style: 'Mizo tribal art'
        },
        'Nagaland': {
            colors: 'tribal red, black, white, yellow',
            patterns: 'Naga tribal patterns, warrior motifs',
            symbols: 'traditional spears, tribal jewelry, hornbill',
            style: 'Naga tribal art style'
        },
        'Odisha': {
            colors: 'vermillion red, yellow, black, white',
            patterns: 'Pattachitra art patterns, temple architecture motifs',
            symbols: 'Jagannath symbols, lotus, temple wheels',
            style: 'Pattachitra traditional art style'
        },
        'Punjab': {
            colors: 'vibrant yellow, red, green',
            patterns: 'Phulkari embroidery patterns, Punjabi folk designs',
            symbols: 'wheat stalks, dhol drum, traditional jewelry',
            style: 'Punjabi folk art with Phulkari patterns'
        },
        'Rajasthan': {
            colors: 'royal red, saffron orange, peacock blue, gold',
            patterns: 'mandala designs, Rajasthani miniature patterns, block print motifs',
            symbols: 'camel, peacock, palace architecture, desert motifs',
            style: 'Rajasthani miniature art style'
        },
        'Sikkim': {
            colors: 'Buddhist prayer flag colors, mountain blue',
            patterns: 'Tibetan mandala patterns, Buddhist motifs',
            symbols: 'prayer flags, mountain peaks, Buddhist symbols',
            style: 'Himalayan Buddhist art style'
        },
        'Tamil Nadu': {
            colors: 'saffron orange, temple red, turmeric yellow, green',
            patterns: 'kolam rangoli patterns, temple gopuram designs, Tanjore art motifs',
            symbols: 'lotus, temple architecture, traditional jewelry, peacock',
            style: 'Tamil traditional art with kolam patterns'
        },
        'Telangana': {
            colors: 'turmeric yellow, vermillion red, green',
            patterns: 'Cheriyal scroll patterns, traditional rangoli designs',
            symbols: 'lotus, peacock, temple motifs',
            style: 'Telangana traditional art'
        },
        'Tripura': {
            colors: 'tribal red, yellow, green',
            patterns: 'traditional weaving patterns, tribal geometric designs',
            symbols: 'bamboo, traditional textiles, tribal symbols',
            style: 'tribal folk art'
        },
        'Uttar Pradesh': {
            colors: 'royal blue, red, yellow, gold',
            patterns: 'Mughal miniature patterns, chikankari embroidery motifs',
            symbols: 'Taj Mahal architecture, peacock, lotus',
            style: 'Mughal miniature art style'
        },
        'Uttarakhand': {
            colors: 'mountain blue, snow white, forest green',
            patterns: 'Aipan art patterns, Himalayan motifs',
            symbols: 'mountain peaks, temple bells, traditional jewelry',
            style: 'Kumaoni Aipan art style'
        },
        'West Bengal': {
            colors: 'vermillion red, yellow, white, terracotta',
            patterns: 'Alpona rangoli patterns, Kalighat painting motifs',
            symbols: 'lotus, fish, Durga symbols, terracotta designs',
            style: 'Bengali traditional art with Alpona patterns'
        },
        'Delhi': {
            colors: 'Mughal red, gold, royal blue',
            patterns: 'Mughal architecture patterns, Delhi sultanate motifs',
            symbols: 'lotus, peacock, historical monuments',
            style: 'Mughal-influenced art style'
        },
        'Puducherry': {
            colors: 'French colonial pastels, coastal blue',
            patterns: 'French colonial architecture, coastal motifs',
            symbols: 'colonial buildings, coastal elements',
            style: 'Indo-French colonial style'
        }
    },
    
    // Prompt templates for different element types
    promptTemplates: {
        icon: 'A {description} icon in {style}, {colors}, minimalist design, flat style, no text, transparent background, cultural symbol',
        pattern: '{description} pattern in {style}, {patterns}, {colors}, seamless tileable design, intricate details, no text, decorative background',
        decoration: '{description} decorative element in {style}, {symbols}, {colors}, ornamental design, no text, artistic embellishment',
        background: '{description} background in {style}, {patterns}, {colors}, subtle design, no text, full coverage pattern',
        illustration: '{description} illustration in {style}, {symbols}, {colors}, artistic rendering, no text, cultural artwork'
    },
    
    // Quality settings
    quality: {
        fast: 'imagen-3.0-fast-generate-001',
        high: 'imagen-3.0-generate-001'
    },
    
    // Aspect ratios supported by Imagen
    aspectRatios: {
        square: '1:1',
        landscape: '16:9',
        portrait: '9:16',
        wide: '4:3'
    }
};

/**
 * Get regional style configuration for a specific state
 * @param {string} state - Indian state name
 * @returns {object} Regional style configuration
 */
export function getRegionalStyle(state) {
    return IMAGE_GENERATION_CONFIG.regionalStyles[state] || {
        colors: 'vibrant traditional Indian colors',
        patterns: 'traditional Indian patterns',
        symbols: 'cultural symbols',
        style: 'traditional Indian art style'
    };
}

/**
 * Build an executable image prompt from structured data
 * @param {string} type - Element type (icon, pattern, decoration, background, illustration)
 * @param {string} description - Element description
 * @param {string} state - Indian state for regional context
 * @returns {string} Formatted prompt for Gemini Imagen
 */
export function buildImagePrompt(type, description, state) {
    const template = IMAGE_GENERATION_CONFIG.promptTemplates[type] || IMAGE_GENERATION_CONFIG.promptTemplates.decoration;
    const regionalStyle = getRegionalStyle(state);
    
    // Replace placeholders with regional style data
    let prompt = template
        .replace('{description}', description)
        .replace('{style}', regionalStyle.style)
        .replace('{colors}', regionalStyle.colors)
        .replace('{patterns}', regionalStyle.patterns)
        .replace('{symbols}', regionalStyle.symbols);
    
    // Ensure prompt doesn't exceed max length
    if (prompt.length > IMAGE_GENERATION_CONFIG.maxPromptLength) {
        prompt = prompt.substring(0, IMAGE_GENERATION_CONFIG.maxPromptLength - 3) + '...';
    }
    
    return prompt;
}

/**
 * Get dimensions for element type
 * @param {string} type - Element type
 * @returns {object} Width and height
 */
export function getDimensionsForType(type) {
    return IMAGE_GENERATION_CONFIG.defaultDimensions[type] || IMAGE_GENERATION_CONFIG.defaultDimensions.decoration;
}
