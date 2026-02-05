/**
 * document.js - Adobe Express Add-on Document Sandbox Script
 * This file runs in the document sandbox and handles document manipulation
 */

// Import Adobe Add-on SDK for document operations
import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor, constants, EditorEvent, colorUtils, fonts } from "express-document-sdk";

// ===== GEMINI API CONFIGURATION =====
// API key is stored in iframe runtime (document sandbox cannot use fetch)

// ===== PROMPT FUNCTIONS SECTION =====
// All prompt templates for Gemini API suggestions
// Note: These are inlined here because relative ES6 module imports are not supported
// in no-build template sandbox environments (QuickJS)

/**
 * Text Size Suggestion Prompt
 * Suggests optimal text sizes based on context
 */
function getTextSizeSuggestionPrompt(state, language, elementData, canvasContext) {
    return `You are a design expert specializing in regional typography for ${state}, India.

Context:
- Target region: ${state}
- Target language: ${language}
- Element type: ${elementData.type || 'Text'}
- Current text: "${elementData.text || ''}"
- Current font size: ${elementData.fontSize || 'Unknown'}px
- Canvas dimensions: ${canvasContext.width || 1920}x${canvasContext.height || 1080}
- Element position: x: ${elementData.bounds?.x || 0}, y: ${elementData.bounds?.y || 0}
- Element dimensions: width: ${elementData.width || 0}, height: ${elementData.height || 0}

Task: Suggest the optimal font size in pixels for this text element.

Consider:
- Regional typography preferences for ${state}
- Readability standards for ${language} language
- Visual hierarchy and design balance
- Common font sizes used in ${state} regional designs
- Element position and canvas layout
- Text length and content type

Output format: Return ONLY a number representing the font size in pixels (e.g., "24" or "32"). Do not include any other text or explanation.`;
}

/**
 * Color Suggestion Prompt
 * Suggests colors based on regional context
 */
function getColorSuggestionPrompt(state, language, elementData, currentColors) {
    return `You are an expert in Indian regional color psychology and cultural color associations for ${state}, India.

Context:
- Target region: ${state}
- Target language: ${language}
- Element type: ${elementData.type || 'Unknown'}
- Current colors: ${currentColors ? JSON.stringify(currentColors) : 'None specified'}
- Element context: ${elementData.text ? `Text: "${elementData.text}"` : 'Visual element'}

Task: Suggest an appropriate color for this element that aligns with ${state} regional preferences and ${language} cultural associations.

Consider:
- Cultural color associations specific to ${state}
- Regional color preferences for ${language} speakers
- Festive/Seasonal color appropriateness for ${state}
- Color harmony with existing design
- Visual appeal for ${state} audiences
- Common color palettes used in ${state} regional designs

Output format: Return the color in this exact format: "#HEXCODE|RGB(r,g,b)|ALPHA"
Example: "#FF9933|RGB(255,153,51)|1.0"
Do not include any other text or explanation.`;
}

/**
 * Position Suggestion Prompt
 * Suggests optimal positioning for elements
 */
function getPositionSuggestionPrompt(state, language, elementData, canvasLayout) {
    return `You are a design expert specializing in regional layout and visual hierarchy for ${state}, India.

Context:
- Target region: ${state}
- Target language: ${language}
- Element type: ${elementData.type || 'Unknown'}
- Current position: x: ${elementData.bounds?.x || 0}, y: ${elementData.bounds?.y || 0}
- Element dimensions: width: ${elementData.width || 0}, height: ${elementData.height || 0}
- Canvas dimensions: ${canvasLayout.width || 1920}x${canvasLayout.height || 1080}
- Element content: ${elementData.text ? `"${elementData.text}"` : 'Visual element'}

Task: Suggest the optimal x and y coordinates for positioning this element on the canvas.

Consider:
- Regional design patterns for ${state}
- Visual hierarchy principles for ${language} content
- Balance and composition appropriate for ${state} regional designs
- Common layout patterns used in ${state}
- Element relationships and spacing
- Readability and visual flow

Output format: Return the position in this exact format: "x:XX|y:YY"
Example: "x:100|y:200"
Do not include any other text or explanation.`;
}

/**
 * Element Analysis Prompt
 * Analyzes selected elements for regional appropriateness
 */
function getElementAnalysisPrompt(state, language, textElements, fontStyles, colors, elementData) {
    // Build text elements list
    let textElementsInfo = '';
    if (textElements && textElements.length > 0) {
        textElementsInfo = `\nText Elements Found (${textElements.length}):\n`;
        textElements.forEach((text, index) => {
            textElementsInfo += `${index + 1}. "${text}"\n`;
        });
    } else {
        textElementsInfo = '\nNo text elements found.';
    }

    // Build font/styles list
    let fontStylesInfo = '';
    if (fontStyles && fontStyles.length > 0) {
        fontStylesInfo = `\nCurrent Fonts/Styles:\n`;
        fontStyles.forEach((style, index) => {
            fontStylesInfo += `${index + 1}. Text: "${style.text}"\n   Font: ${style.font}, Size: ${style.fontSize}pt, Color: ${style.color}\n`;
        });
    } else {
        fontStylesInfo = '\nNo font/style information available.';
    }

    // Build colors list
    let colorsInfo = '';
    if (colors && colors.length > 0) {
        colorsInfo = `\nCurrent Colors:\n`;
        colors.forEach((color, index) => {
            colorsInfo += `${index + 1}. ${color.type}: ${color.color} (${color.rgb})\n`;
        });
    } else {
        colorsInfo = '\nNo color information available.';
    }

    const elementInfo = `
Element Type: ${elementData.type || 'Unknown'}
Text Content: ${elementData.text || 'No text'}
Visual Properties: ${JSON.stringify(elementData.visual || {})}
Color: ${elementData.color ? JSON.stringify(elementData.color) : 'No color data'}
Position: ${elementData.bounds ? JSON.stringify(elementData.bounds) : 'No position data'}
Font: ${elementData.font || 'No font data'}
Font Size: ${elementData.fontSize || 'No font size data'}
`;

    return `You are an expert in Indian regional cultural analysis. Analyze the following design for regional appropriateness for ${state}, India, targeting ${language} language speakers.

Element Information:
${elementInfo}
${textElementsInfo}
${fontStylesInfo}
${colorsInfo}

Provide your analysis in this EXACT format:

1. **Regional Appropriateness Score** (0-100): Output ONLY the number (0-100) on the first line.

2. **Analysis**: Provide a concise single paragraph assessment (exactly 30-40 words) covering language appropriateness, cultural relevance, and visual design fit for ${state} regional aesthetics.

3. **Text Suggestions**: Provide text suggestions in this EXACT format. For each text element, suggest a better alternative:
TEXT_SUGGESTIONS_START
${textElements.length} text elements found
${textElements.map((text, i) => `Original:\n${text}\nAI Suggestion:\n[Your suggestion here]`).join('\n\n')}
TEXT_SUGGESTIONS_END


4. **Style/Font Suggestions**: Provide font and style suggestions in this EXACT format. For each font/style, suggest a better alternative:
STYLE_SUGGESTIONS_START
${fontStyles.length} style suggestions
${fontStyles.map((style, i) => `Original:\n${style.font}, ${style.fontSize}pt\nAI Suggestion:\n[Your suggestion here]`).join('\n\n')}
STYLE_SUGGESTIONS_END

5. **Elements Suggestions**: Generate 2-3 SPECIFIC visual elements that represent ${state} culture. Return ONLY valid JSON array in this EXACT format:

ELEMENTS_SUGGESTIONS_START
[
  {
    "type": "icon",
    "prompt": "Detailed image generation prompt here",
    "description": "Brief user-friendly description",
    "dimensions": { "width": 256, "height": 256 }
  }
]
ELEMENTS_SUGGESTIONS_END

CRITICAL INSTRUCTIONS FOR ELEMENT SUGGESTIONS:
- Generate EXACTLY 2-3 concrete, specific visual elements for ${state}
- Each element must be a REAL cultural landmark, symbol, or pattern from ${state}
- Examples of what to generate for different states:
  * Delhi: India Gate monument, Lotus Temple, Red Fort architecture
  * Tamil Nadu: Meenakshi Temple gopuram, traditional kolam pattern, Tanjore painting style
  * Rajasthan: Hawa Mahal palace, camel with traditional decorations, Rajasthani mandala pattern
  * Kerala: Traditional snake boat, Kathakali mask, coconut palm grove
  * Maharashtra: Gateway of India, Warli tribal art pattern, Ganesh festival decoration

- For ${state}, think of 2-3 SPECIFIC iconic elements (monuments, patterns, cultural symbols)
- Each prompt MUST be detailed and ready for Gemini Imagen API
- Include: specific element name, visual style, colors, "no text", "transparent background" or "background"
- Use appropriate types: "icon" (256x256), "pattern" (512x512), "illustration" (512x512)

EXAMPLE OUTPUT (do NOT copy, generate NEW ones for ${state}):
[
  {
    "type": "illustration",
    "prompt": "India Gate war memorial monument in New Delhi, iconic arch structure, sandstone beige color, blue sky background, architectural illustration style, detailed stonework, no text, realistic rendering",
    "description": "India Gate monument",
    "dimensions": { "width": 512, "height": 512 }
  },
  {
    "type": "icon",
    "prompt": "Lotus Temple Delhi architecture, white marble petals, minimalist icon style, clean lines, spiritual symbol, no text, transparent background",
    "description": "Lotus Temple icon",
    "dimensions": { "width": 256, "height": 256 }
  }
]

6. **Color Suggestions**: Provide color suggestions in this EXACT format. For each color, suggest a better alternative:
COLOR_SUGGESTIONS_START
${colors.length} color suggestions
${colors.map((color, i) => `Original:\n${color.color}\nAI Suggestion:\n[Your suggestion here]`).join('\n\n')}
COLOR_SUGGESTIONS_END

CRITICAL: The ELEMENTS_SUGGESTIONS section MUST be valid JSON array. Each element MUST have executable image generation prompts specific to ${state} culture. Be specific about ${state} regional variations, ${language} language usage, cultural symbols, color preferences, and local customs.`;
}

// Store panel proxy for Gemini API calls
let panelProxy = null;

/**
 * Initialize panel proxy for API calls (async, called after module load)
 * This is separate from exposeApi() which must be synchronous
 */
async function initializePanelProxy() {
    console.log("Initializing panel proxy...");

    // Get panel proxy for API calls (document sandbox cannot use fetch)
    // Used for Gemini API (analysis) and Sarvam API (translation)
    try {
        panelProxy = await addOnSandboxSdk.instance.runtime.apiProxy("panel");
        console.log("Panel proxy obtained for API calls (Gemini & Sarvam)");
    } catch (error) {
        console.error("Error getting panel proxy:", error);
    }
}

// Start panel proxy initialization in background (non-blocking)
initializePanelProxy();

// CRITICAL: exposeApi() MUST be called synchronously at module load time
// The Adobe SDK expects this to be available immediately when the module is imported
console.log("Document sandbox: exposing API synchronously...");
addOnSandboxSdk.instance.runtime.exposeApi({
    getCurrentSelection: async () => {
        return await getCurrentSelection();
    },
    extractElementData: async (nodeOrSelection) => {
        // Handle both node object and selection item
        if (nodeOrSelection && nodeOrSelection.id) {
            // It's already extracted data from getCurrentSelection
            if (nodeOrSelection.type && !nodeOrSelection.bounds) {
                // It's a selection item, need to get the actual node
                const selection = editor.context.selection;
                if (selection.length > 0) {
                    return await extractElementData(selection[0]);
                }
            }
            return nodeOrSelection;
        }
        // Try to get from current selection
        const selection = editor.context.selection;
        if (selection.length > 0) {
            return await extractElementData(selection[0]);
        }
        return null;
    },
    addRecommendationToCanvas: async (recommendation, context) => {
        return await addRecommendationToCanvas(recommendation, context);
    },
    addTextRecommendation: async (text, context) => {
        return await addTextRecommendation(text, context);
    },
    applyColorRecommendation: async (elementId, color) => {
        return await applyColorRecommendation(elementId, color);
    },
    createVisualRecommendation: async (elementType, context) => {
        return await createVisualRecommendation(elementType, context);
    },
    getTextSizeSuggestion: async (state, language, elementData, canvasContext) => {
        return await getTextSizeSuggestion(state, language, elementData, canvasContext);
    },
    getColorSuggestion: async (state, language, elementData, currentColors) => {
        return await getColorSuggestion(state, language, elementData, currentColors);
    },
    getPositionSuggestion: async (state, language, elementData, canvasLayout) => {
        return await getPositionSuggestion(state, language, elementData, canvasLayout);
    },
    analyzeElement: async (state, language, elementData) => {
        return await analyzeElement(state, language, elementData);
    },
    applyTextSuggestion: async (originalText, suggestedText) => {
        return await applyTextSuggestion(originalText, suggestedText);
    },
    applyStyleSuggestion: async (originalStyle, suggestedStyle) => {
        return await applyStyleSuggestion(originalStyle, suggestedStyle);
    },
    applyColorSuggestion: async (originalColor, suggestedColor) => {
        return await applyColorSuggestion(originalColor, suggestedColor);
    },
    generateElementImage: async (imagePrompt, dimensions, state) => {
        return await generateElementImage(imagePrompt, dimensions, state);
    },
    insertGeneratedImage: async (base64Data, position, dimensions) => {
        return await insertGeneratedImage(base64Data, position, dimensions);
    },
    addToCanvas: async (data) => {
        console.log("addToCanvas called with:", data);
        try {
            const text = `Added Template:\n${data.name}`;
            const textNode = editor.createText(text);
            textNode.translation = { x: 100, y: 100 };

            // Set color if provided
            if (data.color) {
                const color = colorUtils.fromHex(data.color);
                const styleRanges = textNode.fullContent.characterStyleRanges;
                if (styleRanges && styleRanges.length > 0) {
                    styleRanges[0].color = color;
                }
            }

            editor.context.insertionParent.children.append(textNode);
            return { success: true };
        } catch (e) {
            console.error("Failed to add to canvas", e);
            throw e;
        }
    }
});
console.log("Document sandbox: API exposed successfully");

/**
 * Get all text elements from current selection or document
 */
function getAllTextElements() {
    try {
        const selection = editor.context.selection;
        const textElements = [];

        // If there's a selection, check if any are text nodes
        if (selection.length > 0) {
            for (const node of selection) {
                if (node.type === constants.SceneNodeType.text) {
                    textElements.push(node);
                }
            }
        }

        // If no text in selection, get all text from current artboard
        if (textElements.length === 0) {
            const currentPage = editor.context.currentPage;
            if (currentPage && currentPage.artboards && currentPage.artboards.length > 0) {
                const artboard = currentPage.artboards.first;

                function traverseForText(node) {
                    if (node.type === constants.SceneNodeType.text) {
                        textElements.push(node);
                    }
                    if (node.allChildren) {
                        for (const child of node.allChildren) {
                            traverseForText(child);
                        }
                    }
                }

                traverseForText(artboard);
            }
        }

        return textElements;
    } catch (error) {
        console.error("Error getting text elements:", error);
        return [];
    }
}

/**
 * Extract text content from a TextNode
 */
function getTextContent(textNode) {
    try {
        if (textNode.fullContent && typeof textNode.fullContent.text === 'string') {
            return textNode.fullContent.text || '';
        }
        return '';
    } catch (error) {
        console.error("Error getting text content:", error);
        return '';
    }
}

/**
 * Get font and style information from text nodes
 */
function getFontStyles(textNodes) {
    const styles = [];

    for (const textNode of textNodes) {
        try {
            if (textNode.fullContent && textNode.fullContent.characterStyleRanges) {
                const styleRanges = textNode.fullContent.characterStyleRanges;
                if (styleRanges.length > 0) {
                    const styleRange = styleRanges[0];
                    const text = getTextContent(textNode);

                    if (text) {
                        styles.push({
                            text: text,
                            font: styleRange.font ? styleRange.font.postscriptName || styleRange.font.family || 'Unknown' : 'Unknown',
                            fontSize: styleRange.fontSize || 0,
                            color: styleRange.color ? colorUtils.toHex(styleRange.color) : '#000000'
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error extracting font style:", error);
        }
    }

    return styles;
}

/**
 * Extract colors from all elements (text colors, fill colors, stroke colors)
 */
function getColors(textNodes, allNodes) {
    const colors = [];
    const colorSet = new Set();

    // Get text colors
    for (const textNode of textNodes) {
        try {
            if (textNode.fullContent && textNode.fullContent.characterStyleRanges) {
                const styleRanges = textNode.fullContent.characterStyleRanges;
                for (const range of styleRanges) {
                    if (range.color) {
                        const hex = colorUtils.toHex(range.color);
                        if (!colorSet.has(hex)) {
                            colorSet.add(hex);
                            colors.push({
                                type: 'text',
                                color: hex,
                                rgb: `RGB(${Math.round(range.color.red * 255)}, ${Math.round(range.color.green * 255)}, ${Math.round(range.color.blue * 255)})`
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error extracting text color:", error);
        }
    }

    // Get fill and stroke colors from all nodes
    const nodesToCheck = allNodes.length > 0 ? allNodes : editor.context.selection;

    for (const node of nodesToCheck) {
        try {
            // Fill color
            if (node.fill && node.fill.type === constants.FillType.color) {
                const hex = colorUtils.toHex(node.fill.color);
                if (!colorSet.has(hex)) {
                    colorSet.add(hex);
                    colors.push({
                        type: 'fill',
                        color: hex,
                        rgb: `RGB(${Math.round(node.fill.color.red * 255)}, ${Math.round(node.fill.color.green * 255)}, ${Math.round(node.fill.color.blue * 255)})`
                    });
                }
            }

            // Stroke color
            if (node.stroke && node.stroke.type === constants.StrokeType.color) {
                const hex = colorUtils.toHex(node.stroke.color);
                if (!colorSet.has(hex)) {
                    colorSet.add(hex);
                    colors.push({
                        type: 'stroke',
                        color: hex,
                        rgb: `RGB(${Math.round(node.stroke.color.red * 255)}, ${Math.round(node.stroke.color.green * 255)}, ${Math.round(node.stroke.color.blue * 255)})`
                    });
                }
            }
        } catch (error) {
            console.error("Error extracting fill/stroke color:", error);
        }
    }

    return colors;
}

/**
 * Parse text suggestions from Gemini response
 */
function parseTextSuggestions(response) {
    const textSuggestions = [];

    try {
        const startMarker = 'TEXT_SUGGESTIONS_START';
        const endMarker = 'TEXT_SUGGESTIONS_END';

        const startIndex = response.indexOf(startMarker);
        const endIndex = response.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1) {
            return textSuggestions;
        }

        const section = response.substring(startIndex + startMarker.length, endIndex).trim();
        const lines = section.split('\n');

        let currentOriginal = null;
        let currentSuggestion = null;
        let collectingSuggestion = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('Original:')) {
                if (currentOriginal && currentSuggestion) {
                    textSuggestions.push({
                        original: currentOriginal,
                        suggestion: currentSuggestion
                    });
                }
                currentOriginal = '';
                currentSuggestion = null;
                collectingSuggestion = false;
            } else if (line.startsWith('AI Suggestion:')) {
                collectingSuggestion = true;
                currentSuggestion = '';
            } else if (line && !line.match(/^\d+\s+text elements found/)) {
                if (collectingSuggestion && currentSuggestion !== null) {
                    currentSuggestion += (currentSuggestion ? '\n' : '') + line;
                } else if (currentOriginal !== null && !collectingSuggestion) {
                    currentOriginal += (currentOriginal ? '\n' : '') + line;
                }
            }
        }

        // Add last pair
        if (currentOriginal && currentSuggestion) {
            textSuggestions.push({
                original: currentOriginal,
                suggestion: currentSuggestion
            });
        }

        // Filter out placeholder texts that are part of the prompt template
        const filteredSuggestions = textSuggestions.filter(item => {
            const original = item.original || '';
            const suggestion = item.suggestion || '';

            // Exclude if original contains prompt markers
            if (original.includes('Elements Suggestions**:') ||
                original.includes('Color Suggestions**:') ||
                original.includes('ELEMENTS_SUGGESTIONS') ||
                original.includes('COLOR_SUGGESTIONS') ||
                original.includes('STYLE_SUGGESTIONS') ||
                original.includes('TEXT_SUGGESTIONS') ||
                original.includes('Provide EXECUTABLE IMAGE') ||
                original.includes('EXACT JSON format')) {
                return false;
            }

            // Exclude if suggestion is to remove placeholder
            if (suggestion.includes('[Remove - Placeholder') ||
                suggestion.includes('Remove - Placeholder')) {
                return false;
            }

            return true;
        });

        return filteredSuggestions;
    } catch (error) {
        console.error("Error parsing text suggestions:", error);
    }

    return textSuggestions;
}

/**
 * Parse style/font suggestions from Gemini response
 */
function parseStyleSuggestions(response) {
    const styleSuggestions = [];

    try {
        const startMarker = 'STYLE_SUGGESTIONS_START';
        const endMarker = 'STYLE_SUGGESTIONS_END';

        const startIndex = response.indexOf(startMarker);
        const endIndex = response.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1) {
            return styleSuggestions;
        }

        const section = response.substring(startIndex + startMarker.length, endIndex).trim();
        const lines = section.split('\n');

        let currentOriginal = null;
        let currentSuggestion = null;
        let collectingSuggestion = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('Original:')) {
                if (currentOriginal && currentSuggestion) {
                    styleSuggestions.push({
                        original: currentOriginal,
                        suggestion: currentSuggestion
                    });
                }
                currentOriginal = '';
                currentSuggestion = null;
                collectingSuggestion = false;
            } else if (line.startsWith('AI Suggestion:')) {
                collectingSuggestion = true;
                currentSuggestion = '';
            } else if (line && !line.match(/^\d+\s+style suggestions/)) {
                if (collectingSuggestion && currentSuggestion !== null) {
                    currentSuggestion += (currentSuggestion ? '\n' : '') + line;
                } else if (currentOriginal !== null && !collectingSuggestion) {
                    currentOriginal += (currentOriginal ? '\n' : '') + line;
                }
            }
        }

        // Add last pair
        if (currentOriginal && currentSuggestion) {
            styleSuggestions.push({
                original: currentOriginal,
                suggestion: currentSuggestion
            });
        }
    } catch (error) {
        console.error("Error parsing style suggestions:", error);
    }

    return styleSuggestions;
}

/**
 * Parse elements suggestions from Gemini response
 * Now supports JSON-structured image generation prompts
 */
function parseElementsSuggestions(response) {
    const elementsSuggestions = [];

    try {
        const startMarker = 'ELEMENTS_SUGGESTIONS_START';
        const endMarker = 'ELEMENTS_SUGGESTIONS_END';

        const startIndex = response.indexOf(startMarker);
        const endIndex = response.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1) {
            console.warn("No ELEMENTS_SUGGESTIONS markers found");
            return elementsSuggestions;
        }

        const section = response.substring(startIndex + startMarker.length, endIndex).trim();

        // Try to parse as JSON
        try {
            const jsonData = JSON.parse(section);

            if (Array.isArray(jsonData)) {
                // Validate and process each element
                jsonData.forEach((item) => {
                    if (item.type && item.prompt && item.description) {
                        elementsSuggestions.push({
                            type: item.type,
                            prompt: item.prompt,
                            description: item.description,
                            dimensions: item.dimensions || { width: 512, height: 512 },
                            isImagePrompt: true // Flag to indicate this is an executable image prompt
                        });
                    }
                });

                console.log(`Parsed ${elementsSuggestions.length} structured image prompts`);
                return elementsSuggestions;
            }
        } catch (jsonError) {
            console.warn("Failed to parse elements as JSON:", jsonError);
            console.log("Section content:", section.substring(0, 200));

            // Fallback: try to extract JSON from markdown code blocks
            const jsonMatch = section.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                try {
                    const jsonData = JSON.parse(jsonMatch[1]);
                    if (Array.isArray(jsonData)) {
                        jsonData.forEach((item) => {
                            if (item.type && item.prompt && item.description) {
                                elementsSuggestions.push({
                                    type: item.type,
                                    prompt: item.prompt,
                                    description: item.description,
                                    dimensions: item.dimensions || { width: 512, height: 512 },
                                    isImagePrompt: true
                                });
                            }
                        });
                        console.log(`Parsed ${elementsSuggestions.length} structured image prompts from code block`);
                        return elementsSuggestions;
                    }
                } catch (e) {
                    console.warn("Failed to parse JSON from code block:", e);
                }
            }
        }
    } catch (error) {
        console.error("Error parsing elements suggestions:", error);
    }

    console.log("No valid element suggestions found");
    return elementsSuggestions;
}

/**
 * Parse color suggestions from Gemini response
 */
function parseColorSuggestions(response) {
    const colorSuggestions = [];

    try {
        const startMarker = 'COLOR_SUGGESTIONS_START';
        const endMarker = 'COLOR_SUGGESTIONS_END';

        const startIndex = response.indexOf(startMarker);
        const endIndex = response.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1) {
            return colorSuggestions;
        }

        const section = response.substring(startIndex + startMarker.length, endIndex).trim();
        const lines = section.split('\n');

        let currentOriginal = null;
        let currentSuggestion = null;
        let collectingSuggestion = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('Original:')) {
                if (currentOriginal && currentSuggestion) {
                    colorSuggestions.push({
                        original: currentOriginal,
                        suggestion: currentSuggestion
                    });
                }
                currentOriginal = '';
                currentSuggestion = null;
                collectingSuggestion = false;
            } else if (line.startsWith('AI Suggestion:')) {
                collectingSuggestion = true;
                currentSuggestion = '';
            } else if (line && !line.match(/^\d+\s+color suggestions/)) {
                if (collectingSuggestion && currentSuggestion !== null) {
                    currentSuggestion += (currentSuggestion ? '\n' : '') + line;
                } else if (currentOriginal !== null && !collectingSuggestion) {
                    currentOriginal += (currentOriginal ? '\n' : '') + line;
                }
            }
        }

        // Add last pair
        if (currentOriginal && currentSuggestion) {
            colorSuggestions.push({
                original: currentOriginal,
                suggestion: currentSuggestion
            });
        }
    } catch (error) {
        console.error("Error parsing color suggestions:", error);
    }

    return colorSuggestions;
}

/**
 * Find text node(s) that match the original text exactly
 */
function findTextNodesByText(originalText) {
    const matchingNodes = [];
    try {
        const textNodes = getAllTextElements();

        for (const textNode of textNodes) {
            const textContent = getTextContent(textNode);
            if (textContent === originalText) {
                matchingNodes.push(textNode);
            }
        }
    } catch (error) {
        console.error("Error finding text nodes:", error);
    }

    return matchingNodes;
}

/**
 * Parse font/style suggestion to extract font name and size
 * Format: "FontName-Style, XXpt" or "FontName-Style, XXpt (comment)"
 */
function parseStyleSuggestion(suggestion) {
    try {
        // Remove comments in parentheses
        const cleaned = suggestion.replace(/\s*\([^)]*\)\s*$/, '').trim();

        // Extract font size (e.g., "105pt" or "96pt")
        const sizeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*pt/i);
        const fontSize = sizeMatch ? parseFloat(sizeMatch[1]) : null;

        // Extract font name (everything before the comma or before the size)
        let fontName = cleaned;
        if (cleaned.includes(',')) {
            fontName = cleaned.split(',')[0].trim();
        } else if (sizeMatch) {
            fontName = cleaned.substring(0, sizeMatch.index).trim();
        }

        // Clean up font name (remove trailing dashes, spaces)
        fontName = fontName.replace(/[\s-]+$/, '').trim();

        return {
            fontName: fontName,
            fontSize: fontSize
        };
    } catch (error) {
        console.error("Error parsing style suggestion:", error);
        return { fontName: null, fontSize: null };
    }
}

/**
 * Convert display font name to PostScript name variations
 * Handles common patterns like "Poppins Black" -> "Poppins-Black", "BebasNeueBook" -> variations
 * 
 * @param {string} displayName - Display name from UI (e.g., "Poppins Black", "BebasNeueBook")
 * @returns {string[]} Array of PostScript name variations to try
 */
function convertDisplayNameToPostScriptVariations(displayName) {
    if (!displayName || typeof displayName !== 'string') {
        return [];
    }

    const variations = new Set(); // Use Set to avoid duplicates

    // Original as-is (might already be PostScript format)
    variations.add(displayName);

    // Common style names mapping
    const styleMap = {
        'black': 'Black',
        'bold': 'Bold',
        'semibold': 'SemiBold',
        'medium': 'Medium',
        'regular': 'Regular',
        'light': 'Light',
        'thin': 'Thin',
        'book': 'Book',
        'italic': 'Italic',
        'bolditalic': 'BoldItalic'
    };

    // Pattern 1: "FontName Style" -> "FontName-Style", "FontNameStyle"
    if (displayName.includes(' ')) {
        const parts = displayName.split(/\s+/);
        const baseName = parts[0];
        const style = parts.slice(1).join(' ');

        // "Poppins Black" -> "Poppins-Black"
        variations.add(`${baseName}-${style}`);

        // "Poppins Black" -> "PoppinsBlack"
        variations.add(`${baseName}${style}`);

        // Try with capitalized style
        const capitalizedStyle = style.charAt(0).toUpperCase() + style.slice(1).toLowerCase();
        variations.add(`${baseName}-${capitalizedStyle}`);
        variations.add(`${baseName}${capitalizedStyle}`);

        // Try mapping common style names
        const lowerStyle = style.toLowerCase();
        if (styleMap[lowerStyle]) {
            variations.add(`${baseName}-${styleMap[lowerStyle]}`);
            variations.add(`${baseName}${styleMap[lowerStyle]}`);
        }
    }

    // Pattern 2: "FontNameStyle" (camelCase) -> "FontName-Style", "FontNameStyle-Regular"
    // Check if it looks like camelCase (e.g., "BebasNeueBook")
    if (!displayName.includes(' ') && !displayName.includes('-')) {
        // Try to split camelCase: "BebasNeueBook" -> ["Bebas", "Neue", "Book"]
        const camelCaseSplit = displayName.match(/[A-Z][a-z]*/g);
        if (camelCaseSplit && camelCaseSplit.length >= 2) {
            const baseName = camelCaseSplit.slice(0, -1).join('');
            const style = camelCaseSplit[camelCaseSplit.length - 1];

            // "BebasNeueBook" -> "BebasNeue-Book"
            variations.add(`${baseName}-${style}`);

            // Try with "Regular" suffix
            variations.add(`${displayName}-Regular`);

            // Try mapping style
            const lowerStyle = style.toLowerCase();
            if (styleMap[lowerStyle]) {
                variations.add(`${baseName}-${styleMap[lowerStyle]}`);
            }
        }

        // Also try adding "-Regular" suffix
        variations.add(`${displayName}-Regular`);
    }

    // Pattern 3: Already hyphenated -> try variations
    if (displayName.includes('-')) {
        // "Poppins-Black" -> keep as-is, also try without hyphen
        variations.add(displayName.replace(/-/g, ''));
        variations.add(displayName.replace(/-/g, ' '));

        // Try with different case
        const parts = displayName.split('-');
        if (parts.length === 2) {
            variations.add(`${parts[0]}-${parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase()}`);
        }
    }

    // Pattern 4: Try common PostScript name formats
    // Remove all spaces and hyphens, then add common suffixes
    const noSpaces = displayName.replace(/[\s-]+/g, '');
    variations.add(`${noSpaces}-Regular`);
    variations.add(`${noSpaces}-Bold`);
    variations.add(`${noSpaces}-Medium`);

    // Convert to array, filter out empty strings, and return
    return Array.from(variations).filter(name => name && name.length > 0);
}

/**
 * Find text node(s) that match the original font/style
 */
/**
 * Find text nodes matching a specific font and size
 * Handles font name variations (case-insensitive, PostScript name variations)
 */
function findTextNodesByStyle(originalFont, originalFontSize) {
    const matchingNodes = [];
    try {
        const textNodes = getAllTextElements();

        // Normalize font name for comparison (case-insensitive, handle variations)
        const normalizeFontName = (fontName) => {
            if (!fontName) return '';
            return fontName.toLowerCase()
                .replace(/-/g, '')
                .replace(/\s+/g, '')
                .trim();
        };

        const normalizedOriginalFont = normalizeFontName(originalFont);

        for (const textNode of textNodes) {
            if (textNode.fullContent && textNode.fullContent.characterStyleRanges) {
                const styleRanges = textNode.fullContent.characterStyleRanges;

                // Check all style ranges, not just the first one
                for (const styleRange of styleRanges) {
                    if (!styleRange.font) continue;

                    const nodeFontPostScript = styleRange.font.postscriptName || '';
                    const nodeFontFamily = styleRange.font.family || '';
                    const nodeFontSize = styleRange.fontSize || 0;

                    // Normalize both font names for comparison
                    const normalizedPostScript = normalizeFontName(nodeFontPostScript);
                    const normalizedFamily = normalizeFontName(nodeFontFamily);

                    // Match by PostScript name or family name (case-insensitive, flexible matching)
                    const fontMatches =
                        normalizedPostScript === normalizedOriginalFont ||
                        normalizedFamily === normalizedOriginalFont ||
                        normalizedPostScript.includes(normalizedOriginalFont) ||
                        normalizedOriginalFont.includes(normalizedPostScript) ||
                        normalizedFamily.includes(normalizedOriginalFont) ||
                        normalizedOriginalFont.includes(normalizedFamily);

                    // Match fontSize with tolerance (within 0.1pt)
                    const sizeMatches = Math.abs(nodeFontSize - originalFontSize) < 0.1;

                    if (fontMatches && sizeMatches) {
                        matchingNodes.push(textNode);
                        break; // Found match, no need to check other ranges for this node
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error finding text nodes by style:", error);
    }

    return matchingNodes;
}

/**
 * Apply text suggestion - replace original text with AI suggestion
 * Uses workaround pattern: replaceText() without TextStyleSource, then reapply characterStyleRanges
 */
async function applyTextSuggestion(originalText, suggestedText) {
    try {
        // Validate inputs
        if (!originalText || typeof originalText !== 'string') {
            throw new Error('Original text is required');
        }
        if (!suggestedText || typeof suggestedText !== 'string') {
            throw new Error('Suggested text is required');
        }

        const matchingNodes = findTextNodesByText(originalText);

        if (matchingNodes.length === 0) {
            throw new Error(`No text node found matching: "${originalText.substring(0, 50)}${originalText.length > 50 ? '...' : ''}"`);
        }

        // Replace text in the first matching node (exact match only)
        const textNode = matchingNodes[0];
        const textContent = textNode.fullContent.text;

        // Verify text content matches (handle whitespace differences)
        const normalizedOriginal = originalText.trim();
        const normalizedContent = textContent.trim();

        if (normalizedContent !== normalizedOriginal && textContent !== originalText) {
            throw new Error(`Text content mismatch. Expected: "${originalText.substring(0, 50)}...", Found: "${textContent.substring(0, 50)}..."`);
        }

        // Check for unavailable fonts before replacement
        if (textNode.fullContent.hasUnavailableFonts && textNode.fullContent.hasUnavailableFonts()) {
            throw new Error('Text contains fonts that are unavailable. Please replace fonts first before modifying text.');
        }

        // Use workaround pattern: save styles, replace text, then reapply styles
        // This preserves formatting better than using TextStyleSource
        await editor.queueAsyncEdit(async () => {
            // Save existing character style ranges
            const savedStyles = textNode.fullContent.characterStyleRanges;
            const textLength = textContent.length;

            // Replace text without TextStyleSource (workaround for style preservation)
            textNode.fullContent.replaceText(
                suggestedText,
                { start: 0, length: textLength }
            );

            // Reapply saved character styles to preserve formatting
            // Note: If text length changed significantly, styles might not map perfectly
            // but this is better than losing all styles
            if (savedStyles && savedStyles.length > 0) {
                try {
                    textNode.fullContent.characterStyleRanges = savedStyles;
                } catch (styleError) {
                    console.warn('Could not fully reapply styles after text replacement:', styleError);
                    // Styles might not map perfectly if text length changed significantly
                    // This is acceptable - at least we tried to preserve them
                }
            }
        });

        console.log(`Applied text suggestion: "${originalText.substring(0, 50)}..." -> "${suggestedText.substring(0, 50)}..."`);
        return { success: true, message: `Text replaced successfully` };
    } catch (error) {
        console.error("Error applying text suggestion:", error);
        // Provide more helpful error messages
        if (error.message.includes('replaceText') || error.message.includes('experimental')) {
            throw new Error('Text replacement failed. Make sure experimental APIs are enabled in manifest.json');
        }
        if (error.message.includes('hasUnavailableFonts')) {
            throw new Error('Text contains unavailable fonts. Please replace fonts first before modifying text.');
        }
        throw error;
    }
}

/**
 * Apply style/font suggestion - change font and size of matching text nodes
 * Checks font availability and handles errors gracefully
 */
async function applyStyleSuggestion(originalStyle, suggestedStyle) {
    try {
        // Parse original style to get font and size
        const originalParsed = parseStyleSuggestion(originalStyle);
        if (!originalParsed.fontName || !originalParsed.fontSize) {
            throw new Error(`Could not parse original style: "${originalStyle}"`);
        }

        // Parse suggested style
        const suggestedParsed = parseStyleSuggestion(suggestedStyle);
        if (!suggestedParsed.fontName || !suggestedParsed.fontSize) {
            throw new Error(`Could not parse suggested style: "${suggestedStyle}"`);
        }

        // Find matching text nodes
        const matchingNodes = findTextNodesByStyle(originalParsed.fontName, originalParsed.fontSize);

        if (matchingNodes.length === 0) {
            throw new Error(`No text nodes found matching style: "${originalStyle}"`);
        }

        // Load font asynchronously with multiple fallback attempts
        // Convert display name to PostScript name variations
        const fontNameVariations = convertDisplayNameToPostScriptVariations(suggestedParsed.fontName);

        console.log(`Attempting to load font "${suggestedParsed.fontName}" with ${fontNameVariations.length} variations:`, fontNameVariations);

        let fontObject = null;
        let lastError = null;

        for (const fontName of fontNameVariations) {
            try {
                fontObject = await fonts.fromPostscriptName(fontName);
                if (fontObject) {
                    console.log(`✓ Successfully loaded font: "${fontName}" (PostScript: ${fontObject.postscriptName})`);
                    break;
                }
            } catch (fontError) {
                lastError = fontError;
                console.log(`✗ Failed to load font "${fontName}":`, fontError.message || fontError);
                continue;
            }
        }

        if (!fontObject) {
            const attemptedNames = fontNameVariations.slice(0, 10).join(', ') + (fontNameVariations.length > 10 ? ` ... (${fontNameVariations.length} total)` : '');
            const errorMessage = `Font not found: "${suggestedParsed.fontName}". Tried ${fontNameVariations.length} variations including: ${attemptedNames}. Please ensure the font is available in Adobe Express.`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        // Check font availability for editing
        if (!fontObject.availableForEditing) {
            throw new Error(`Font "${fontObject.postscriptName || suggestedParsed.fontName}" is not available for editing. This may be a premium font requiring a subscription.`);
        }

        // Check if font is premium and log warning
        if (fontObject.isPremium) {
            console.warn(`Using premium font: ${fontObject.postscriptName}. User must have subscription.`);
        }

        // Apply font and size to all matching nodes
        await editor.queueAsyncEdit(async () => {
            for (const textNode of matchingNodes) {
                try {
                    // Check for unavailable fonts in the text node
                    if (textNode.fullContent.hasUnavailableFonts && textNode.fullContent.hasUnavailableFonts()) {
                        console.warn('Text node contains unavailable fonts. Attempting to replace...');
                    }

                    const textContent = textNode.fullContent.text;
                    if (textContent.length > 0) {
                        textNode.fullContent.applyCharacterStyles(
                            { font: fontObject, fontSize: suggestedParsed.fontSize },
                            { start: 0, length: textContent.length }
                        );
                        console.log(`Applied style to text node: "${textContent.substring(0, 30)}..."`);
                    }
                } catch (nodeError) {
                    console.error(`Error applying style to individual text node:`, nodeError);
                    // Continue with other nodes even if one fails
                }
            }
        });

        console.log(`Applied style suggestion: "${originalStyle}" -> "${suggestedStyle}" to ${matchingNodes.length} node(s)`);
        return { success: true, message: `Style applied successfully to ${matchingNodes.length} text element(s)` };
    } catch (error) {
        // Log full error details for debugging
        console.error("Error applying style suggestion:", {
            error: error,
            message: error.message,
            stack: error.stack,
            originalStyle: originalStyle,
            suggestedStyle: suggestedStyle
        });

        // Ensure error is always thrown (not swallowed)
        // Provide more helpful error messages based on error type
        let errorMessage = error.message || 'Unknown error occurred';

        if (error.message && error.message.includes('not found')) {
            errorMessage = `Font not found: ${error.message}`;
        } else if (error.message && error.message.includes('not available')) {
            errorMessage = `Font not available: ${error.message}`;
        } else if (error.message && error.message.includes('parse')) {
            errorMessage = `Style parsing error: ${error.message}`;
        } else if (error.message && error.message.includes('No text nodes')) {
            errorMessage = `No matching text found: ${error.message}`;
        } else if (error.message && error.message.includes('Font error')) {
            errorMessage = error.message; // Already formatted
        } else {
            // Generic error - include original message
            errorMessage = `Failed to apply style: ${errorMessage}`;
        }

        // Create new error with improved message to ensure it's thrown
        const improvedError = new Error(errorMessage);
        improvedError.originalError = error;
        throw improvedError;
    }
}

/**
 * Apply color suggestion - change color of selected elements
 */
async function applyColorSuggestion(originalColor, suggestedColor) {
    try {
        // Parse suggested color (hex format)
        let colorHex = suggestedColor.trim();

        // Remove any extra text after hex code
        const hexMatch = colorHex.match(/#[0-9A-Fa-f]{6,8}/);
        if (hexMatch) {
            colorHex = hexMatch[0];
        }

        // Convert hex to Color object
        const colorObject = colorUtils.fromHex(colorHex);

        // Get selected elements
        const selection = editor.context.selection;

        if (selection.length === 0) {
            throw new Error("Please select an element to apply the color suggestion");
        }

        // Apply color to selected elements
        await editor.queueAsyncEdit(async () => {
            for (const node of selection) {
                // Apply to text color if it's a text node
                if (node.type === constants.SceneNodeType.text) {
                    const textContent = node.fullContent.text;
                    if (textContent.length > 0) {
                        node.fullContent.applyCharacterStyles(
                            { color: colorObject },
                            { start: 0, length: textContent.length }
                        );
                    }
                }

                // Apply to fill color if node has fill
                if (node.fill && node.fill.type === constants.FillType.color) {
                    node.fill = editor.makeColorFill(colorObject);
                }

                // Apply to stroke color if node has stroke
                if (node.stroke && node.stroke.type === constants.StrokeType.color) {
                    node.stroke = editor.makeStroke({
                        ...node.stroke,
                        color: colorObject
                    });
                }
            }
        });

        console.log(`Applied color suggestion: "${originalColor}" -> "${suggestedColor}"`);
        return { success: true, message: `Color applied successfully` };
    } catch (error) {
        console.error("Error applying color suggestion:", error);
        throw error;
    }
}

/**
 * Analyze element using Gemini API (proxied through iframe)
 */
async function analyzeElement(state, language, elementData) {
    try {
        if (!panelProxy) {
            throw new Error('Panel proxy not available');
        }

        // Collect all text elements, fonts, styles, and colors
        const textNodes = getAllTextElements();
        const textElements = textNodes.map(node => getTextContent(node)).filter(text => text.length > 0);
        const fontStyles = getFontStyles(textNodes);
        const colors = getColors(textNodes, textNodes);

        // Get all nodes for color extraction
        const allNodes = editor.context.selection.length > 0
            ? Array.from(editor.context.selection)
            : [];

        // If no selection, get all nodes from artboard
        if (allNodes.length === 0) {
            const currentPage = editor.context.currentPage;
            if (currentPage && currentPage.artboards && currentPage.artboards.length > 0) {
                const artboard = currentPage.artboards.first;
                function collectNodes(node) {
                    allNodes.push(node);
                    if (node.allChildren) {
                        for (const child of node.allChildren) {
                            collectNodes(child);
                        }
                    }
                }
                collectNodes(artboard);
            }
        }

        const allColors = getColors(textNodes, allNodes);

        const prompt = getElementAnalysisPrompt(state, language, textElements, fontStyles, allColors, elementData);

        // Call Gemini API through iframe proxy
        const result = await panelProxy.callGeminiAPI(prompt);

        // Parse score and analysis
        const lines = result.split('\n');
        let score = null;
        let analysis = '';

        // Look for score in first few lines
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const scoreMatch = lines[i].match(/\b(\d{1,3})\b/);
            if (scoreMatch) {
                const potentialScore = parseInt(scoreMatch[1]);
                if (potentialScore >= 0 && potentialScore <= 100) {
                    score = potentialScore;
                    break;
                }
            }
        }

        if (score === null) {
            score = 75; // Default score
        }

        // Extract analysis paragraph (between score and first suggestion section)
        const textStartIndex = result.indexOf('TEXT_SUGGESTIONS_START');
        const styleStartIndex = result.indexOf('STYLE_SUGGESTIONS_START');
        const firstSectionIndex = Math.min(
            textStartIndex !== -1 ? textStartIndex : Infinity,
            styleStartIndex !== -1 ? styleStartIndex : Infinity
        );

        if (firstSectionIndex !== Infinity) {
            analysis = result.substring(0, firstSectionIndex)
                .replace(/^\d+\s*$/, '') // Remove score line
                .trim()
                .split('\n')
                .filter(line => line.trim() && !line.match(/^\d+$/)) // Remove empty lines and score
                .join(' ')
                .substring(0, 200); // Limit to ~40 words
        } else {
            // Fallback: extract first paragraph after score
            const scoreLineIndex = result.search(/\b\d{1,3}\b/);
            if (scoreLineIndex !== -1) {
                const afterScore = result.substring(scoreLineIndex).replace(/^\d+\s*/, '').trim();
                analysis = afterScore.split('\n').filter(line => line.trim())[0] || '';
            }
        }

        // Parse four-part suggestions
        const textSuggestions = parseTextSuggestions(result);
        const styleSuggestions = parseStyleSuggestions(result);
        const elementsSuggestions = parseElementsSuggestions(result);
        const colorSuggestions = parseColorSuggestions(result);

        return {
            score,
            analysis,
            textSuggestions,
            styleSuggestions,
            elementsSuggestions,
            colorSuggestions
        };
    } catch (error) {
        console.error("Error analyzing element:", error);
        throw error;
    }
}

/**
 * Add text to the Adobe Express canvas
 */
async function addTextToCanvas(text, options = {}) {
    try {
        // Create text node using editor API
        const textNode = editor.createText(text);
        if (options.position) {
            textNode.translation = options.position;
        }
        if (options.fontSize) {
            // Set font size if provided
            const styleRanges = textNode.fullContent.characterStyleRanges;
            if (styleRanges && styleRanges.length > 0) {
                styleRanges[0].fontSize = options.fontSize;
            }
        }

        // Add to canvas
        editor.context.insertionParent.children.append(textNode);

        console.log("Text added to canvas:", textNode.id);

        return textNode;
    } catch (error) {
        console.error("Error adding text to canvas:", error);
        throw error;
    }
}

/**
 * Get the current selection from the document
 */
async function getCurrentSelection() {
    try {
        const selection = editor.context.selection;

        if (selection.length === 0) {
            return { items: [] };
        }

        const items = await Promise.all(selection.map(async (node) => {
            const elementData = await extractElementData(node);
            return {
                id: node.id,
                type: node.type,
                bounds: node.boundsInParent,
                ...elementData
            };
        }));

        console.log("Current selection:", items);

        return { items };
    } catch (error) {
        console.error("Error getting selection:", error);
        return { items: [] };
    }
}

/**
 * Extract element data from a node
 */
async function extractElementData(node) {
    try {
        if (!node) {
            return null;
        }

        const data = {
            type: node.type || 'Unknown',
            id: node.id || '',
            bounds: node.boundsInParent || {}
        };

        // Extract text content if it's a text node
        if (node.type === constants.SceneNodeType.text ||
            node.type === "Text") {
            try {
                if (node.fullContent && typeof node.fullContent.text === 'string') {
                    data.text = node.fullContent.text || '';
                    if (node.fullContent.characterStyleRanges && node.fullContent.characterStyleRanges.length > 0) {
                        const styleRange = node.fullContent.characterStyleRanges[0];
                        // Extract font information
                        if (styleRange.font) {
                            data.font = styleRange.font.postscriptName || '';
                            data.fontFamily = styleRange.font.family || '';
                        }
                        // Extract font size
                        if (styleRange.fontSize !== undefined) {
                            data.fontSize = styleRange.fontSize;
                        }
                        // Extract text alignment
                        if (node.textAlignment !== undefined) {
                            data.textAlignment = node.textAlignment;
                        }
                        // Extract text color
                        if (styleRange.color) {
                            data.textColor = {
                                red: styleRange.color.red,
                                green: styleRange.color.green,
                                blue: styleRange.color.blue,
                                alpha: styleRange.color.alpha || 1
                            };
                        }
                        // Extract letter spacing
                        if (styleRange.letterSpacing !== undefined) {
                            data.letterSpacing = styleRange.letterSpacing;
                        }
                    }
                }
            } catch (e) {
                console.warn("Could not extract text:", e);
            }
        }

        // Extract visual properties
        try {
            if (node.fill) {
                const fill = node.fill;
                if (fill.type === constants.FillType.color) {
                    data.color = {
                        red: fill.color.red,
                        green: fill.color.green,
                        blue: fill.color.blue,
                        alpha: fill.color.alpha
                    };
                }
            }
        } catch (e) {
            console.warn("Could not extract fill:", e);
        }

        try {
            if (node.stroke) {
                const stroke = node.stroke;
                if (stroke.type === constants.StrokeType.color) {
                    data.strokeColor = {
                        red: stroke.color.red,
                        green: stroke.color.green,
                        blue: stroke.color.blue,
                        alpha: stroke.color.alpha
                    };
                    data.strokeWidth = stroke.width || 0;
                }
            }
        } catch (e) {
            console.warn("Could not extract stroke:", e);
        }

        // Extract dimensions for rectangular nodes
        try {
            if (node.width !== undefined && node.height !== undefined) {
                data.width = node.width;
                data.height = node.height;
            }
        } catch (e) {
            console.warn("Could not extract dimensions:", e);
        }

        // Extract position data (translation)
        try {
            if (node.translation !== undefined) {
                data.translation = {
                    x: node.translation.x || 0,
                    y: node.translation.y || 0
                };
            }
            // Also extract from bounds if available
            if (node.boundsInParent) {
                data.position = {
                    x: node.boundsInParent.x || 0,
                    y: node.boundsInParent.y || 0
                };
            }
        } catch (e) {
            console.warn("Could not extract position:", e);
        }

        // Detect if element is part of a template/group
        try {
            if (node.parent && node.parent.type) {
                data.parentType = node.parent.type;
                // Check if parent is a Group (template indicator)
                if (node.parent.type === constants.SceneNodeType.group ||
                    node.parent.type === "Group") {
                    data.isPartOfTemplate = true;
                    data.templateType = "Group";
                    // Count siblings to understand template structure
                    if (node.parent.children) {
                        data.siblingCount = node.parent.children.length;
                    }
                }
            }
        } catch (e) {
            console.warn("Could not extract template info:", e);
        }

        return data;
    } catch (error) {
        console.error("Error extracting element data:", error);
        return {
            type: node?.type || 'Unknown',
            id: node?.id || '',
            error: error.message
        };
    }
}

/**
 * Parse recommendation text to determine action type
 * Priority: Color > Text > Visual
 */
function parseRecommendation(recommendationText) {
    const text = recommendationText.toLowerCase();

    // Priority 1: Check for color recommendations (highest priority)
    // Must contain "color"/"colour" AND (hex code OR RGB OR "use [color]" pattern)
    const hasColorKeyword = text.includes('color') || text.includes('colour');
    const hasColorValue = text.match(/#[0-9a-f]{6}/i) ||
        text.match(/rgb\(/i) ||
        text.match(/use\s+\w+\s+color/i) ||
        text.match(/change\s+color/i);

    if (hasColorKeyword && hasColorValue) {
        return { type: 'color', color: extractColorFromRecommendation(recommendationText) };
    }

    // Also check if it's just a hex/RGB without keyword (still color)
    if (text.match(/#[0-9a-f]{6}/i) || text.match(/rgb\(/i)) {
        return { type: 'color', color: extractColorFromRecommendation(recommendationText) };
    }

    // Priority 2: Check for visual element recommendations (BEFORE text to prevent false positives)
    // Expanded patterns to catch more visual element recommendations
    const visualKeywords = [
        'circle', 'rectangle', 'square', 'triangle', 'ellipse',
        'shape', 'element', 'symbol', 'icon', 'geometric',
        'decorative'
    ];

    const hasVisualKeyword = visualKeywords.some(keyword => text.includes(keyword));
    const hasVisualAction = text.match(/\b(add|create|include|insert)\s+(?:a\s+|an\s+)?(?:decorative\s+|geometric\s+)?/i);

    // Check for visual element patterns
    if ((hasVisualAction && hasVisualKeyword) ||
        text.match(/add\s+(?:a\s+|an\s+)?(?:decorative\s+|geometric\s+)?(?:circle|rectangle|square|triangle|shape|element)/i) ||
        text.match(/create\s+(?:a\s+|an\s+)?(?:decorative\s+|geometric\s+)?(?:circle|rectangle|square|triangle|shape|element)/i) ||
        text.match(/include\s+(?:a\s+|an\s+)?(?:decorative\s+|geometric\s+)?(?:circle|rectangle|square|triangle|shape|element)/i)) {
        return { type: 'visual', element: extractElementFromRecommendation(recommendationText) };
    }

    // Priority 2.5: Check for border recommendations (BEFORE font to prevent false positives)
    if (text.includes('border') || text.includes('outline') || text.includes('frame')) {
        const borderPatterns = [
            /(?:add|create|integrate|include)\s+(?:a\s+|an\s+)?(?:thin|thick|professional[-\s]?grade)?\s*(?:dark\s+)?(?:blue|red|green|black|white|gray|grey)?\s*border/i,
            /border\s+around/i,
            /(?:thin|thick)\s+border/i
        ];

        if (borderPatterns.some(pattern => pattern.test(text))) {
            return { type: 'border', recommendationText: recommendationText };
        }
    }

    // Priority 2.6: Check for font size recommendations
    if (text.includes('font') && (text.includes('size') || text.includes('larger') || text.includes('smaller') ||
        text.match(/\d+\s*(pt|px)/i) || text.match(/font\s+size\s+to\s+\d+/i))) {
        const fontSize = extractFontSizeFromRecommendation(recommendationText);
        // Accept both numeric values and relative markers ('larger', 'smaller')
        if (fontSize && (typeof fontSize === 'number' && fontSize > 0 || fontSize === 'larger' || fontSize === 'smaller')) {
            return { type: 'fontSize', fontSize: fontSize };
        }
    }

    // Priority 2.7: Check for font family recommendations
    if (text.includes('font') && (text.includes('switch') || text.includes('change') || text.includes('use') ||
        text.includes('apply') || text.match(/like\s+\w+\s+or\s+\w+/i))) {
        const fontName = extractFontFamilyFromRecommendation(recommendationText);
        if (fontName) {
            return { type: 'fontFamily', fontName: fontName };
        }
    }

    // Priority 3: Check for text recommendations (AFTER visual to prevent false positives)
    // Must contain "add text" or "text in [language]" pattern
    if ((text.includes('add') && text.includes('text')) ||
        text.match(/text\s+in\s+[a-z]+:/i) ||
        text.match(/add\s+text\s+in\s+[a-z]+/i) ||
        (text.includes('change') && text.includes('text'))) {
        const extractedText = extractTextFromRecommendation(recommendationText);
        // Only return text type if we successfully extracted text (not empty)
        if (extractedText && extractedText !== recommendationText && extractedText.length > 0) {
            return { type: 'text', text: extractedText };
        }
    }

    // Default: text note (only if no other type matched)
    // But don't return full recommendation if it looks like an instruction
    if (text.match(/^(add|create|include|use|change)\s+/i)) {
        // This looks like an instruction that wasn't parsed, return empty to trigger error
        return { type: 'text', text: '' };
    }

    return { type: 'text', text: recommendationText };
}

/**
 * Extract text from recommendation
 * Returns extracted text content, or empty string if extraction fails
 */
function extractTextFromRecommendation(recommendationText) {
    if (!recommendationText) return '';

    // Pattern 1: "Add text in Tamil: 'தீபாவளி'" or "text in Tamil: 'தீபாவளி'"
    const langPatternMatch = recommendationText.match(/(?:add\s+)?text\s+in\s+\w+:\s*["']([^"']+)["']/i);
    if (langPatternMatch && langPatternMatch[1]) {
        return langPatternMatch[1].trim();
    }

    // Pattern 2: "Add text: 'content'" or "Add text: content" (with/without quotes)
    // Also handles "Add this text: content"
    const addTextPattern = recommendationText.match(/add\s+(?:this\s+)?text\s*:\s*["']?([^"']+)["']?/i);
    if (addTextPattern && addTextPattern[1]) {
        const extracted = addTextPattern[1].trim();
        // Make sure it's not empty and not just whitespace
        if (extracted.length > 0) {
            return extracted;
        }
    }

    // Pattern 3: "Add: 'content'" (simplified pattern)
    const simpleAddPattern = recommendationText.match(/add\s*:\s*["']([^"']+)["']/i);
    if (simpleAddPattern && simpleAddPattern[1]) {
        return simpleAddPattern[1].trim();
    }

    // Pattern 4: Any quoted text (single or double quotes) - but prioritize patterns above
    const quotedMatch = recommendationText.match(/["']([^"']+)["']/);
    if (quotedMatch && quotedMatch[1]) {
        const extracted = quotedMatch[1].trim();
        // Don't return if it's just a color code or very short
        // Also check it's not part of a color/instruction pattern
        if (extracted.length > 2 &&
            !extracted.match(/^#[0-9a-f]{6}$/i) &&
            !recommendationText.toLowerCase().match(/color|colour|rgb/i)) {
            return extracted;
        }
    }

    // Pattern 5: Text after colon (but not if it's part of "color:" or similar)
    // Handle unquoted text after "Add text:" or "Add text in [language]:"
    const colonMatch = recommendationText.match(/:\s*([^:]+)$/);
    if (colonMatch && colonMatch[1]) {
        const afterColon = colonMatch[1].trim();
        // Check if it's not a color value or instruction
        if (!afterColon.match(/^(#[0-9a-f]{6}|rgb\(|use|change)/i) &&
            afterColon.length > 2 &&
            // Make sure it's not a shape instruction
            !afterColon.toLowerCase().match(/\b(circle|rectangle|square|shape|element)\b/)) {
            // Remove quotes if present
            const cleaned = afterColon.replace(/^["']|["']$/g, '');
            return cleaned.trim();
        }
    }

    // Pattern 6: Extract text in non-English scripts (Tamil, Hindi, etc.)
    // Look for text that contains non-ASCII characters
    const nonAsciiMatch = recommendationText.match(/[^\x00-\x7F]+/);
    if (nonAsciiMatch && nonAsciiMatch[0]) {
        const extracted = nonAsciiMatch[0].trim();
        // Make sure it's substantial text, not just a single character
        if (extracted.length > 1) {
            return extracted;
        }
    }

    // If no pattern matches, return empty string (don't use full recommendation)
    return '';
}

/**
 * Extract color from recommendation
 */
function extractColorFromRecommendation(recommendationText) {
    // Try hex color
    const hexMatch = recommendationText.match(/#([0-9a-f]{6})/i);
    if (hexMatch) {
        const hex = hexMatch[1];
        return {
            red: parseInt(hex.substring(0, 2), 16) / 255,
            green: parseInt(hex.substring(2, 4), 16) / 255,
            blue: parseInt(hex.substring(4, 6), 16) / 255,
            alpha: 1
        };
    }

    // Try RGB
    const rgbMatch = recommendationText.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
    if (rgbMatch) {
        return {
            red: parseInt(rgbMatch[1]) / 255,
            green: parseInt(rgbMatch[2]) / 255,
            blue: parseInt(rgbMatch[3]) / 255,
            alpha: 1
        };
    }

    // Default color (saffron for India)
    return { red: 1, green: 0.6, blue: 0.2, alpha: 1 };
}

/**
 * Extract font size from recommendation
 * Returns font size in pixels, or null if not found
 */
function extractFontSizeFromRecommendation(recommendationText) {
    if (!recommendationText) return null;

    const text = recommendationText.toLowerCase();

    // Pattern 1: Explicit size with unit "24pt", "18px"
    const sizeWithUnit = recommendationText.match(/(\d+)\s*(pt|px)/i);
    if (sizeWithUnit) {
        let size = parseInt(sizeWithUnit[1]);
        const unit = sizeWithUnit[2].toLowerCase();
        // Convert pt to px: 1pt ≈ 1.33px (using 1.2 for simplicity)
        if (unit === 'pt') {
            size = Math.round(size * 1.2);
        }
        return size;
    }

    // Pattern 2: "font size to 24" or "set font to 20"
    const sizePattern = text.match(/(?:font\s+size\s+to|set\s+font\s+to|font\s+to)\s+(\d+)/i);
    if (sizePattern) {
        return parseInt(sizePattern[1]);
    }

    // Pattern 3: Just a number after "font size" or "fontSize"
    const numberPattern = recommendationText.match(/(?:font\s+size|fontsize)\s*[:\s]+(\d+)/i);
    if (numberPattern) {
        return parseInt(numberPattern[1]);
    }

    // Pattern 4: Relative changes - "larger" or "smaller"
    // These will need current font size context, return null for now
    // Will be handled in applyFontSizeRecommendation
    if (text.includes('larger') || text.includes('increase')) {
        return 'larger'; // Special marker for relative increase
    }
    if (text.includes('smaller') || text.includes('decrease')) {
        return 'smaller'; // Special marker for relative decrease
    }

    return null;
}

/**
 * Extract font family name from recommendation
 * Returns font name string, or null if not found
 */
function extractFontFamilyFromRecommendation(recommendationText) {
    if (!recommendationText) return null;

    const text = recommendationText.toLowerCase();

    // Common font names to look for
    const fontNames = [
        'raleway', 'montserrat', 'source sans', 'source sans 3', 'source sans3',
        'arial', 'times new roman', 'times', 'helvetica', 'georgia',
        'verdana', 'courier', 'courier new', 'comic sans', 'trebuchet',
        'tahoma', 'lucida', 'palatino', 'garamond', 'bookman'
    ];

    // Pattern 1: "like Raleway or Montserrat" - extract first font
    const likePattern = text.match(/like\s+(\w+)(?:\s+or\s+\w+)?/i);
    if (likePattern) {
        const fontName = likePattern[1];
        // Check if it's a known font name
        const matchedFont = fontNames.find(f => fontName.toLowerCase().includes(f.split(' ')[0]));
        if (matchedFont) {
            return matchedFont;
        }
        // Return the extracted name anyway (will try to map it)
        return fontName;
    }

    // Pattern 2: "switch the font to [font name]" or "change font to [font name]"
    const switchPattern = text.match(/(?:switch|change|use|apply)\s+(?:the\s+)?font\s+to\s+(\w+)/i);
    if (switchPattern) {
        const fontName = switchPattern[1];
        const matchedFont = fontNames.find(f => fontName.toLowerCase().includes(f.split(' ')[0]));
        if (matchedFont) {
            return matchedFont;
        }
        return fontName;
    }

    // Pattern 3: Look for font names directly in text
    for (const fontName of fontNames) {
        if (text.includes(fontName)) {
            return fontName;
        }
    }

    return null;
}

/**
 * Map font family name to PostScript name
 * Returns PostScript name or null if not found
 */
function mapFontNameToPostScript(fontName) {
    if (!fontName) return null;

    const name = fontName.toLowerCase().trim();
    const mappings = {
        'raleway': ['Raleway-Regular', 'Raleway-Bold', 'Raleway-Light'],
        'montserrat': ['Montserrat-Regular', 'Montserrat-Bold', 'Montserrat-Light'],
        'source sans': ['SourceSans3-Regular', 'SourceSans3-Bold'],
        'source sans 3': ['SourceSans3-Regular', 'SourceSans3-Bold'],
        'source sans3': ['SourceSans3-Regular', 'SourceSans3-Bold'],
        'arial': ['ArialMT', 'Arial-BoldMT'],
        'times new roman': ['TimesNewRomanPSMT', 'TimesNewRomanPS-BoldMT'],
        'times': ['TimesNewRomanPSMT', 'TimesNewRomanPS-BoldMT'],
        'helvetica': ['Helvetica', 'Helvetica-Bold'],
        'georgia': ['Georgia', 'Georgia-Bold'],
        'verdana': ['Verdana', 'Verdana-Bold'],
        'courier': ['Courier', 'Courier-Bold'],
        'courier new': ['CourierNewPSMT', 'CourierNewPS-BoldMT']
    };

    // Try exact match first
    if (mappings[name]) {
        return mappings[name][0]; // Return Regular variant first
    }

    // Try partial match
    for (const [key, variants] of Object.entries(mappings)) {
        if (name.includes(key) || key.includes(name)) {
            return variants[0];
        }
    }

    // Try capitalizing first letter (e.g., "Raleway" -> "Raleway-Regular")
    const capitalized = fontName.charAt(0).toUpperCase() + fontName.slice(1).toLowerCase();
    return `${capitalized}-Regular`;
}

/**
 * Extract element type from recommendation
 */
function extractElementFromRecommendation(recommendationText) {
    const text = recommendationText.toLowerCase();

    // Check for specific shapes first
    if (text.includes('circle') || text.includes('ellipse')) return 'circle';
    if (text.includes('rectangle') || text.includes('square')) return 'rectangle';
    if (text.includes('triangle')) return 'triangle';

    // Check for generic shape descriptions
    if (text.includes('decorative') && text.includes('circle')) return 'circle';
    if (text.includes('geometric') && text.includes('circle')) return 'circle';

    // Default to rectangle for generic shapes/elements
    if (text.includes('shape') || text.includes('element')) return 'rectangle';

    // Final default
    return 'rectangle';
}

/**
 * Apply font size recommendation
 */
async function applyFontSizeRecommendation(fontSize, context = {}) {
    try {
        const selection = editor.context.selection;

        // Handle relative font size changes
        let finalFontSize = fontSize;
        if (fontSize === 'larger' || fontSize === 'smaller') {
            // Need current font size to calculate relative change
            if (selection.length > 0 && selection[0].type === constants.SceneNodeType.text) {
                const textNode = selection[0];
                const currentSize = textNode.fullContent.characterStyleRanges[0]?.fontSize || 24;
                if (fontSize === 'larger') {
                    finalFontSize = Math.round(currentSize * 1.15); // 15% increase
                } else {
                    finalFontSize = Math.round(currentSize * 0.85); // 15% decrease
                }
            } else {
                // Default to 15% change from 24px
                finalFontSize = fontSize === 'larger' ? 28 : 20;
            }
        }

        if (selection.length > 0 && selection[0].type === constants.SceneNodeType.text) {
            // Apply to selected text node
            const textNode = selection[0];
            const textContent = textNode.fullContent.text || "";
            if (textContent.length > 0) {
                textNode.fullContent.applyCharacterStyles(
                    { fontSize: finalFontSize },
                    { start: 0, length: textContent.length }
                );
                console.log(`Applied font size ${finalFontSize} to selected text`);
            }
        } else {
            // Apply to all text nodes in current artboard
            const currentPage = editor.context.currentPage;
            if (!currentPage || !currentPage.artboards || currentPage.artboards.length === 0) {
                throw new Error("No artboard found");
            }

            const artboard = currentPage.artboards.first;

            function traverseAndApplyFontSize(node) {
                if (node.type === constants.SceneNodeType.text) {
                    const textContent = node.fullContent.text || "";
                    if (textContent.length > 0) {
                        node.fullContent.applyCharacterStyles(
                            { fontSize: finalFontSize },
                            { start: 0, length: textContent.length }
                        );
                    }
                }
                // Recursively check children
                if (node.allChildren) {
                    for (const child of node.allChildren) {
                        traverseAndApplyFontSize(child);
                    }
                }
            }

            traverseAndApplyFontSize(artboard);
            console.log(`Applied font size ${finalFontSize} to all text nodes in artboard`);
        }

        return { success: true, fontSize: finalFontSize };
    } catch (error) {
        console.error("Error applying font size:", error);
        throw error;
    }
}

/**
 * Apply font family recommendation
 */
async function applyFontFamilyRecommendation(fontName, context = {}) {
    try {
        // Map font name to PostScript name
        const postScriptName = mapFontNameToPostScript(fontName);
        if (!postScriptName) {
            throw new Error(`Could not map font name "${fontName}" to PostScript name`);
        }

        // Get font object (async)
        const fontObject = await fonts.fromPostscriptName(postScriptName);
        if (!fontObject) {
            // Try alternative variants
            const alternatives = [
                postScriptName.replace('-Regular', '-Bold'),
                postScriptName.replace('-Regular', '-Light'),
                postScriptName.replace('-Regular', '')
            ];

            let foundFont = null;
            for (const alt of alternatives) {
                foundFont = await fonts.fromPostscriptName(alt);
                if (foundFont) break;
            }

            if (!foundFont) {
                throw new Error(`Font "${postScriptName}" not available for editing`);
            }

            // Use found font
            await editor.queueAsyncEdit(async () => {
                await applyFontToNodes(foundFont, context);
            });
            return { success: true, fontName: foundFont.family };
        }

        // Apply font using queueAsyncEdit for async operations
        await editor.queueAsyncEdit(async () => {
            await applyFontToNodes(fontObject, context);
        });

        return { success: true, fontName: fontObject.family };
    } catch (error) {
        console.error("Error applying font family:", error);
        throw error;
    }
}

/**
 * Helper function to apply font to nodes
 */
async function applyFontToNodes(fontObject, context = {}) {
    const selection = editor.context.selection;

    if (selection.length > 0 && selection[0].type === constants.SceneNodeType.text) {
        // Apply to selected text node
        const textNode = selection[0];
        const textContent = textNode.fullContent.text || "";
        if (textContent.length > 0) {
            textNode.fullContent.applyCharacterStyles(
                { font: fontObject },
                { start: 0, length: textContent.length }
            );
            console.log(`Applied font ${fontObject.family} to selected text`);
        }
    } else {
        // Apply to all text nodes in current artboard
        const currentPage = editor.context.currentPage;
        if (!currentPage || !currentPage.artboards || currentPage.artboards.length === 0) {
            throw new Error("No artboard found");
        }

        const artboard = currentPage.artboards.first;

        function traverseAndApplyFont(node) {
            if (node.type === constants.SceneNodeType.text) {
                const textContent = node.fullContent.text || "";
                if (textContent.length > 0) {
                    node.fullContent.applyCharacterStyles(
                        { font: fontObject },
                        { start: 0, length: textContent.length }
                    );
                }
            }
            // Recursively check children
            if (node.allChildren) {
                for (const child of node.allChildren) {
                    traverseAndApplyFont(child);
                }
            }
        }

        traverseAndApplyFont(artboard);
        console.log(`Applied font ${fontObject.family} to all text nodes in artboard`);
    }
}

/**
 * Create border around text element
 */
async function createBorderAroundText(recommendationText, context = {}) {
    try {
        const selection = editor.context.selection;

        // Get target text node
        let textNode = null;
        if (selection.length > 0 && selection[0].type === constants.SceneNodeType.text) {
            textNode = selection[0];
        } else {
            // Try to find text node from context
            if (context.selectedElementId) {
                const currentPage = editor.context.currentPage;
                if (currentPage && currentPage.artboards && currentPage.artboards.length > 0) {
                    const artboard = currentPage.artboards.first;
                    function findTextNode(node) {
                        if (node.type === constants.SceneNodeType.text && node.id === context.selectedElementId) {
                            return node;
                        }
                        if (node.allChildren) {
                            for (const child of node.allChildren) {
                                const found = findTextNode(child);
                                if (found) return found;
                            }
                        }
                        return null;
                    }
                    textNode = findTextNode(artboard);
                }
            }
        }

        if (!textNode) {
            throw new Error("Please select a text element to add a border around");
        }

        // Extract color and width from recommendation
        const text = recommendationText.toLowerCase();
        let borderColor = { red: 0, green: 0, blue: 0.5, alpha: 1 }; // Default dark blue
        let borderWidth = 2; // Default thin border

        // Extract color
        if (text.includes('dark blue')) {
            borderColor = { red: 0, green: 0, blue: 0.5, alpha: 1 };
        } else if (text.includes('blue')) {
            borderColor = { red: 0, green: 0.4, blue: 1, alpha: 1 };
        } else if (text.includes('black')) {
            borderColor = { red: 0, green: 0, blue: 0, alpha: 1 };
        } else if (text.includes('red')) {
            borderColor = { red: 1, green: 0, blue: 0, alpha: 1 };
        } else if (text.includes('green')) {
            borderColor = { red: 0, green: 0.8, blue: 0, alpha: 1 };
        }

        // Try to extract hex color
        const hexMatch = recommendationText.match(/#([0-9a-f]{6})/i);
        if (hexMatch) {
            const hex = hexMatch[1];
            borderColor = {
                red: parseInt(hex.substring(0, 2), 16) / 255,
                green: parseInt(hex.substring(2, 4), 16) / 255,
                blue: parseInt(hex.substring(4, 6), 16) / 255,
                alpha: 1
            };
        }

        // Extract width
        if (text.includes('thin')) {
            borderWidth = 1;
        } else if (text.includes('thick')) {
            borderWidth = 4;
        } else if (text.includes('professional')) {
            borderWidth = 2; // Professional-grade is typically medium
        }

        // Get text bounds
        const textBounds = textNode.boundsInParent || textNode.boundsLocal;
        if (!textBounds) {
            throw new Error("Could not get text bounds");
        }

        // Add padding around text (10px default)
        const padding = 10;

        // Create rectangle border
        const borderRect = editor.createRectangle();
        borderRect.width = textBounds.width + (padding * 2);
        borderRect.height = textBounds.height + (padding * 2);

        // Position rectangle around text
        borderRect.translation = {
            x: textBounds.x - padding,
            y: textBounds.y - padding
        };

        // Apply stroke (no fill)
        borderRect.stroke = editor.makeStroke({
            color: borderColor,
            width: borderWidth,
            position: constants.StrokePosition.inside
        });

        // No fill (transparent)
        borderRect.fill = editor.makeColorFill(colorUtils.fromRGB(1, 1, 1, 0)); // Transparent white

        // Append to same parent as text
        const parent = textNode.parent;
        if (parent && parent.children) {
            parent.children.append(borderRect);
            console.log(`Created border around text: ${borderWidth}px, color: ${JSON.stringify(borderColor)}`);
        } else {
            // Fallback to insertion parent
            editor.context.insertionParent.children.append(borderRect);
        }

        return { success: true, borderRect: borderRect };
    } catch (error) {
        console.error("Error creating border:", error);
        throw error;
    }
}

/**
 * Add recommendation to canvas
 */
async function addRecommendationToCanvas(recommendationText, context = {}) {
    try {
        console.log("Adding recommendation to canvas:", recommendationText);
        const parsed = parseRecommendation(recommendationText);
        console.log("Parsed recommendation type:", parsed.type);

        // For color recommendations, ensure we have a selection
        if (parsed.type === 'color') {
            // Get current selection if not in context
            if (!context.selectedElementId) {
                const selection = editor.context.selection;
                if (selection.length === 0) {
                    throw new Error("Please select an element to apply color");
                }
                context.selectedElementId = selection[0].id;
                if (!context.elementData && selection.length > 0) {
                    context.elementData = await extractElementData(selection[0]);
                }
            }
        }

        // For text recommendations, ensure we extracted actual text
        if (parsed.type === 'text') {
            if (!parsed.text || parsed.text === '') {
                // If extraction failed, throw error instead of falling back to full recommendation
                throw new Error("Could not extract text content from recommendation: " + recommendationText);
            }
        }

        // Ensure visual element recommendations don't fall through to text default
        if (parsed.type === 'visual' && !parsed.element) {
            throw new Error("Could not determine visual element type from recommendation: " + recommendationText);
        }

        // For font size recommendations, ensure we have a valid fontSize
        if (parsed.type === 'fontSize' && !parsed.fontSize) {
            throw new Error("Could not extract font size from recommendation: " + recommendationText);
        }

        // For font family recommendations, ensure we have a fontName
        if (parsed.type === 'fontFamily' && !parsed.fontName) {
            throw new Error("Could not extract font family from recommendation: " + recommendationText);
        }

        // For border recommendations, ensure we have a selection
        if (parsed.type === 'border') {
            const selection = editor.context.selection;
            if (selection.length === 0 && !context.selectedElementId) {
                throw new Error("Please select a text element to add a border around");
            }
        }

        let result;
        switch (parsed.type) {
            case 'text':
                result = await addTextRecommendation(parsed.text, context);
                console.log("Text recommendation added successfully");
                break;
            case 'color':
                result = await applyColorRecommendation(context.selectedElementId, parsed.color, context);
                console.log("Color recommendation applied successfully");
                break;
            case 'visual':
                result = await createVisualRecommendation(parsed.element, context);
                console.log("Visual recommendation created successfully");
                break;
            case 'fontSize':
                result = await applyFontSizeRecommendation(parsed.fontSize, context);
                console.log("Font size recommendation applied successfully");
                break;
            case 'fontFamily':
                result = await applyFontFamilyRecommendation(parsed.fontName, context);
                console.log("Font family recommendation applied successfully");
                break;
            case 'border':
                result = await createBorderAroundText(parsed.recommendationText || recommendationText, context);
                console.log("Border recommendation applied successfully");
                break;
            default:
                // Default to text, but only if we have valid text
                if (parsed.text && parsed.text !== '') {
                    result = await addTextRecommendation(parsed.text, context);
                    console.log("Default text recommendation added successfully");
                } else {
                    throw new Error("Could not parse recommendation: " + recommendationText);
                }
        }

        return { success: true, recommendationType: parsed.type, result: result };
    } catch (error) {
        console.error("Error adding recommendation:", error);
        console.error("Error stack:", error.stack);
        // Re-throw with more context
        throw new Error(`Failed to apply recommendation: ${error.message}`);
    }
}

/**
 * Add text recommendation to canvas
 */
async function addTextRecommendation(text, context = {}) {
    try {
        // Validate text input
        if (!text || text.trim() === '') {
            throw new Error("No text content to add");
        }

        // Translate text if language is specified and translation is enabled
        let finalText = text.trim();
        if (context.translateText !== false && context.language && context.language !== 'English') {
            try {
                if (!panelProxy) {
                    console.warn("Panel proxy not available for translation, using original text");
                } else {
                    console.log(`Translating text to ${context.language}:`, finalText.substring(0, 50) + '...');

                    // Determine source language (default to English)
                    const sourceLang = 'English'; // Recommendations are typically in English

                    // Call Sarvam Translate API through panel proxy
                    const translatedText = await panelProxy.callSarvamTranslateAPI(
                        finalText,
                        sourceLang,
                        context.language
                    );

                    if (translatedText && translatedText.trim().length > 0) {
                        finalText = translatedText.trim();
                        console.log("Text translated successfully:", finalText.substring(0, 50) + '...');
                    } else {
                        console.warn("Translation returned empty, using original text");
                    }
                }
            } catch (translationError) {
                console.error("Error translating text:", translationError);
                console.warn("Falling back to original text due to translation error");
                // Continue with original text if translation fails
            }
        } else {
            console.log("Translation skipped:", context.translateText === false ? "translation disabled" :
                !context.language ? "no language specified" : "language is English");
        }

        // Get insertion position
        let position = { x: 50, y: 50 };

        if (context.selectedElementId) {
            try {
                const selection = editor.context.selection;
                if (selection.length > 0) {
                    const selectedNode = selection[0];
                    const bounds = selectedNode.boundsInParent;
                    position = {
                        x: bounds.x,
                        y: bounds.y + bounds.height + 20
                    };
                }
            } catch (e) {
                console.warn("Could not get selection position:", e);
            }
        }

        // Optionally get suggestions if context provides state and language
        if (context.useSuggestions && context.state && context.language) {
            try {
                // Get canvas context
                const root = editor.documentRoot;
                const pages = root.pages;
                const canvasContext = {
                    width: pages.length > 0 && pages[0].artboards.length > 0
                        ? pages[0].artboards[0].width || 1920 : 1920,
                    height: pages.length > 0 && pages[0].artboards.length > 0
                        ? pages[0].artboards[0].height || 1080 : 1080
                };

                // Get element data for suggestions
                const elementData = context.elementData || {};
                elementData.text = finalText; // Use translated text for suggestions

                // Get position suggestion
                if (context.getPositionSuggestion !== false) {
                    const suggestedPosition = await getPositionSuggestion(
                        context.state,
                        context.language,
                        elementData,
                        canvasContext
                    );
                    if (suggestedPosition) {
                        position = suggestedPosition;
                    }
                }
            } catch (e) {
                console.warn("Could not get suggestions, using default:", e);
            }
        }

        // Create text node with translated text
        const textNode = editor.createText(finalText);

        // Position the text node using setPositionInParent (recommended for text nodes)
        const insertionParent = editor.context.insertionParent;
        textNode.setPositionInParent(position, { x: 0, y: 0 });

        // Apply font size and color suggestions if available
        if (context.useSuggestions && context.state && context.language) {
            try {
                const root = editor.documentRoot;
                const pages = root.pages;
                const canvasContext = {
                    width: pages.length > 0 && pages[0].artboards.length > 0
                        ? pages[0].artboards[0].width || 1920 : 1920,
                    height: pages.length > 0 && pages[0].artboards.length > 0
                        ? pages[0].artboards[0].height || 1080 : 1080
                };

                const elementData = context.elementData || {};
                elementData.text = text;

                // Get font size suggestion
                if (context.getTextSizeSuggestion !== false) {
                    const fontSize = await getTextSizeSuggestion(
                        context.state,
                        context.language,
                        elementData,
                        canvasContext
                    );
                    if (fontSize && fontSize > 0) {
                        // Use applyCharacterStyles to set font size (proper API method)
                        textNode.fullContent.applyCharacterStyles(
                            { fontSize: fontSize },
                            { start: 0, length: text.length }
                        );
                    }
                }
            } catch (e) {
                console.warn("Could not apply font size suggestion:", e);
            }
        }

        // Add to canvas - CRITICAL: must be added to insertionParent
        insertionParent.children.append(textNode);

        console.log("Text recommendation added:", textNode.id);
        return textNode;
    } catch (error) {
        console.error("Error adding text recommendation:", error);
        throw error;
    }
}

/**
 * Apply color recommendation to selected element
 */
async function applyColorRecommendation(elementId, color, context = {}) {
    try {
        const selection = editor.context.selection;

        // If no selection and no elementId provided, throw error
        if (selection.length === 0 && !elementId) {
            throw new Error("No element selected. Please select an element to apply color.");
        }

        // Get the node to apply color to
        let node = null;
        if (selection.length > 0) {
            // Use current selection (prioritize selection over elementId)
            node = selection[0];
        } else if (elementId) {
            // Try to find node by ID (if selection not available)
            // Note: This is a simplified approach - actual implementation may need to search document tree
            throw new Error("Element ID lookup not implemented. Please select an element.");
        }

        if (!node) {
            throw new Error("No element available to apply color");
        }

        // Optionally get color suggestion if context provides state and language
        let colorToApply = color;
        if (context.useSuggestions && context.state && context.language && !color) {
            try {
                const elementData = await extractElementData(node);
                const currentColors = {
                    primary: elementData.color || null,
                    secondary: elementData.strokeColor || null
                };

                const colorSuggestion = await getColorSuggestion(
                    context.state,
                    context.language,
                    elementData,
                    currentColors
                );

                if (colorSuggestion && colorSuggestion.rgb) {
                    colorToApply = colorSuggestion.rgb;
                }
            } catch (e) {
                console.warn("Could not get color suggestion, using provided color:", e);
            }
        }

        // Ensure we have a color to apply
        if (!colorToApply) {
            throw new Error("No color specified in recommendation");
        }

        // Apply color based on node type
        if (node.fill !== undefined) {
            // For shapes with fill property (Rectangle, Ellipse, etc.)
            const colorFill = editor.makeColorFill(colorToApply);
            node.fill = colorFill;
            console.log("Color applied to element fill:", colorToApply);
        } else if (node.type === constants.SceneNodeType.text || node.type === "Text") {
            // For text nodes, use applyCharacterStyles API
            try {
                const textNode = node;
                const textContent = textNode.fullContent.text || "";
                if (textContent.length > 0) {
                    // Use applyCharacterStyles to set color (proper API method)
                    textNode.fullContent.applyCharacterStyles(
                        { color: colorToApply },
                        { start: 0, length: textContent.length }
                    );
                    console.log("Color applied to text:", colorToApply);
                } else {
                    throw new Error("Text node has no content");
                }
            } catch (e) {
                console.error("Could not apply color to text:", e);
                throw new Error("Could not apply color to selected text element: " + e.message);
            }
        } else {
            throw new Error("Selected element does not support color changes. Please select a shape or text element.");
        }

        console.log("Color recommendation applied successfully");
        return true;
    } catch (error) {
        console.error("Error applying color recommendation:", error);
        throw error;
    }
}

/**
 * Create visual element recommendation
 */
async function createVisualRecommendation(elementType, context = {}) {
    try {
        let node;
        let position = { x: 50, y: 50 };

        // Get position relative to selection
        if (context.selectedElementId) {
            try {
                const selection = editor.context.selection;
                if (selection.length > 0) {
                    const selectedNode = selection[0];
                    const bounds = selectedNode.boundsInParent;
                    position = {
                        x: bounds.x + bounds.width + 20,
                        y: bounds.y
                    };
                }
            } catch (e) {
                console.warn("Could not get selection position:", e);
            }
        }

        // Create element based on type
        switch (elementType) {
            case 'circle':
                node = editor.createEllipse();
                node.rx = 50;
                node.ry = 50;
                break;
            case 'rectangle':
            default:
                node = editor.createRectangle();
                node.width = 100;
                node.height = 100;
                break;
        }

        // Position the element using setPositionInParent (recommended method)
        const insertionParent = editor.context.insertionParent;
        node.setPositionInParent(position, { x: 0, y: 0 });

        // Apply default fill color if needed
        if (!node.fill) {
            const defaultColor = colorUtils.fromRGB(0.2, 0.4, 0.8, 1); // Blue default
            node.fill = editor.makeColorFill(defaultColor);
        }

        // Add to canvas - CRITICAL: must be added to insertionParent
        insertionParent.children.append(node);

        console.log("Visual recommendation added:", node.id);
        return node;
    } catch (error) {
        console.error("Error creating visual recommendation:", error);
        throw error;
    }
}

/**
 * Get text size suggestion from Gemini (proxied through iframe)
 */
async function getTextSizeSuggestion(state, language, elementData, canvasContext) {
    try {
        if (!panelProxy) {
            console.warn("Panel proxy not available, using default font size");
            return 24;
        }

        // Use hardcoded prompt function
        const prompt = getTextSizeSuggestionPrompt(state, language, elementData, canvasContext);

        // Call Gemini API through iframe proxy
        const responseText = await panelProxy.callGeminiAPI(prompt);

        // Extract number from response
        const sizeMatch = responseText.match(/\d+/);
        const fontSize = sizeMatch ? parseInt(sizeMatch[0]) : 24; // Default to 24px

        console.log("Text size suggestion:", fontSize);
        return fontSize;
    } catch (error) {
        console.error("Error getting text size suggestion:", error);
        return 24; // Default fallback
    }
}

/**
 * Get color suggestion from Gemini (proxied through iframe)
 */
async function getColorSuggestion(state, language, elementData, currentColors) {
    try {
        if (!panelProxy) {
            console.warn("Panel proxy not available, using default color");
            return {
                hex: "#FF9933",
                rgb: { red: 1, green: 0.6, blue: 0.2, alpha: 1.0 }
            };
        }

        // Use hardcoded prompt function
        const prompt = getColorSuggestionPrompt(state, language, elementData, currentColors);

        // Call Gemini API through iframe proxy
        const responseText = await panelProxy.callGeminiAPI(prompt);

        // Parse color from format: "#HEXCODE|RGB(r,g,b)|ALPHA"
        const colorMatch = responseText.match(/#([0-9A-Fa-f]{6})\|RGB\((\d+),(\d+),(\d+)\)\|([\d.]+)/);

        if (colorMatch) {
            const hex = colorMatch[1];
            const r = parseInt(colorMatch[2]) / 255;
            const g = parseInt(colorMatch[3]) / 255;
            const b = parseInt(colorMatch[4]) / 255;
            const alpha = parseFloat(colorMatch[5]);

            const color = {
                hex: `#${hex}`,
                rgb: { red: r, green: g, blue: b, alpha: alpha }
            };

            console.log("Color suggestion:", color);
            return color;
        } else {
            // Fallback: try to extract hex code
            const hexMatch = responseText.match(/#([0-9A-Fa-f]{6})/i);
            if (hexMatch) {
                const hex = hexMatch[1];
                const r = parseInt(hex.substring(0, 2), 16) / 255;
                const g = parseInt(hex.substring(2, 4), 16) / 255;
                const b = parseInt(hex.substring(4, 6), 16) / 255;

                return {
                    hex: `#${hex}`,
                    rgb: { red: r, green: g, blue: b, alpha: 1.0 }
                };
            }
        }

        // Default fallback color
        return {
            hex: "#FF9933",
            rgb: { red: 1, green: 0.6, blue: 0.2, alpha: 1.0 }
        };
    } catch (error) {
        console.error("Error getting color suggestion:", error);
        return {
            hex: "#FF9933",
            rgb: { red: 1, green: 0.6, blue: 0.2, alpha: 1.0 }
        };
    }
}

/**
 * Get position suggestion from Gemini (proxied through iframe)
 */
async function getPositionSuggestion(state, language, elementData, canvasLayout) {
    try {
        if (!panelProxy) {
            console.warn("Panel proxy not available, using default position");
            return { x: 50, y: 50 };
        }

        // Use hardcoded prompt function
        const prompt = getPositionSuggestionPrompt(state, language, elementData, canvasLayout);

        // Call Gemini API through iframe proxy
        const responseText = await panelProxy.callGeminiAPI(prompt);

        // Parse position from format: "x:XX|y:YY"
        const positionMatch = responseText.match(/x:(\d+)\|y:(\d+)/);

        if (positionMatch) {
            const position = {
                x: parseInt(positionMatch[1]),
                y: parseInt(positionMatch[2])
            };

            console.log("Position suggestion:", position);
            return position;
        } else {
            // Fallback: extract numbers
            const numbers = responseText.match(/\d+/g);
            if (numbers && numbers.length >= 2) {
                return {
                    x: parseInt(numbers[0]),
                    y: parseInt(numbers[1])
                };
            }
        }

        // Default fallback position
        return { x: 50, y: 50 };
    } catch (error) {
        console.error("Error getting position suggestion:", error);
        return { x: 50, y: 50 };
    }
}

/**
 * Generate element image using Gemini Imagen API
 * @param {string} imagePrompt - Detailed prompt for image generation
 * @param {object} dimensions - Width and height for the image
 * @param {string} state - Regional state for context
 * @returns {string} Base64-encoded image data
 */
async function generateElementImage(imagePrompt, dimensions = { width: 512, height: 512 }, state = '') {
    try {
        if (!panelProxy) {
            throw new Error('Panel proxy not available for image generation');
        }

        console.log(`Generating image with prompt: "${imagePrompt.substring(0, 100)}..."`);
        console.log(`Dimensions: ${dimensions.width}x${dimensions.height}`);

        // Call Gemini Imagen API through panel proxy
        const base64Image = await panelProxy.callGeminiImagenAPI(imagePrompt, dimensions);

        if (!base64Image || base64Image.length === 0) {
            throw new Error('Image generation returned empty result');
        }

        console.log(`Image generated successfully, data length: ${base64Image.length}`);
        return base64Image;
    } catch (error) {
        console.error("Error generating element image:", error);
        throw new Error(`Failed to generate image: ${error.message}`);
    }
}

/**
 * Insert generated image into canvas
 * @param {string} base64Data - Base64-encoded image data
 * @param {object} position - X and Y coordinates
 * @param {object} dimensions - Width and height
 * @returns {object} Created media container node
 */
async function insertGeneratedImage(base64Data, position = { x: 100, y: 100 }, dimensions = { width: 512, height: 512 }) {
    try {
        console.log("Inserting generated image to canvas...");

        // Convert base64 to blob
        const base64Clean = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

        // Decode base64 to binary
        const binaryString = atob(base64Clean);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create blob from binary data
        const blob = new Blob([bytes], { type: 'image/png' });

        console.log("Image blob created, size:", blob.size);

        // For now, create a placeholder rectangle
        // TODO: Replace with actual image insertion when SDK supports it
        const placeholder = editor.createRectangle();
        placeholder.width = dimensions.width;
        placeholder.height = dimensions.height;
        placeholder.translation = position;

        const placeholderColor = colorUtils.fromRGB(0.9, 0.9, 0.9, 1);
        placeholder.fill = editor.makeColorFill(placeholderColor);

        const insertionParent = editor.context.insertionParent;
        insertionParent.children.append(placeholder);

        console.log("Placeholder created for generated image");

        return {
            node: placeholder,
            imageData: base64Data,
            message: "Image generated successfully"
        };
    } catch (error) {
        console.error("Error inserting generated image:", error);
        throw new Error(`Failed to insert image: ${error.message}`);
    }
}

// Note: exposeApi() is called synchronously at module load time (lines 258-350)
// Panel proxy initialization runs asynchronously in the background

console.log("document.js loaded successfully");
