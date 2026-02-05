/**
 * prompts.js - Prompt functions for Gemini API
 * Contains all prompt templates used for generating AI suggestions
 */

/**
 * Text Size Suggestion Prompt
 * Suggests optimal text sizes based on context
 */
export function getTextSizeSuggestionPrompt(state, language, elementData, canvasContext) {
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
export function getColorSuggestionPrompt(state, language, elementData, currentColors) {
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
export function getPositionSuggestionPrompt(state, language, elementData, canvasLayout) {
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
export function getElementAnalysisPrompt(state, language, elementData) {
    const elementInfo = `
Element Type: ${elementData.type || 'Unknown'}
Text Content: ${elementData.text || 'No text'}
Visual Properties: ${JSON.stringify(elementData.visual || {})}
Color: ${elementData.color ? JSON.stringify(elementData.color) : 'No color data'}
Position: ${elementData.bounds ? JSON.stringify(elementData.bounds) : 'No position data'}
Font: ${elementData.font || 'No font data'}
Font Size: ${elementData.fontSize || 'No font size data'}
`;

    return `You are an expert in Indian regional cultural analysis. Analyze the following design element for regional appropriateness for ${state}, India, targeting ${language} language speakers.

Element Information:
${elementInfo}

Provide your analysis in this exact format:

1. **Regional Appropriateness Score** (0-100): Rate how appropriate this element is for ${state} region and ${language} language speakers. Output ONLY the number (0-100) on the first line.

2. **Analysis**: Provide a concise single paragraph assessment (exactly 30-40 words) covering:
   - Language appropriateness for ${language} speakers in ${state}
   - Cultural relevance to ${state} norms and preferences
   - Visual design fit for ${state} regional aesthetics
   Keep it brief and focused - exactly 30-40 words total.

3. **Recommendations** (exactly 2-5 actionable bullet points): Provide specific, actionable recommendations to improve regional fit. Each recommendation should be:
   - Specific and actionable (e.g., "Use saffron color (#FF9933) for better Tamil Nadu appeal" or "Add text in Tamil: 'தீபாவளி விற்பனை'" or "Switch the font to Raleway for a more contemporary look" or "Add a thin dark blue border around the instruction text")
   - Focused on text changes, color adjustments, font size modifications, font family changes, border additions, or visual element additions
   - Formatted as bullet points starting with "-"
   - Provide exactly 2-5 recommendations (not more, not less)

Format your response as follows:
- First line: Score number only (0-100)
- Second paragraph: Analysis (30-40 words)
- Then: Recommendations as bullet points starting with "-"

Be specific about ${state} regional variations, ${language} language usage, cultural symbols, color preferences, and local customs.`;
}
