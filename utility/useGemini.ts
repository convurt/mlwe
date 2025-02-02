// geminiSimple.js
// (1) Import necessary classes from @google/generative-ai
import * as FileSystem from 'expo-file-system';

const {GoogleGenerativeAI,} = require("@google/generative-ai");

// (2) Configure your Gemini removed key
const removed = ''; // (Adjust to your environment)
const genAI = new GoogleGenerativeAI(removed);

// formatted date for today
const today = new Date().toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"});

// (3) Define the model and system instruction
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: `You are a major league baseball knowledgebase answering a users question about MLB,  Return a nicely formatted response for a mobile device.  The date today is ${today}.`,
});

// (4) Adjust generation settings
//     - temperature, topP, topK, maxOutputTokens
const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// (5) Example function to send messages and get a response
//     - 'prompt': string of user input
//     - 'history': optional array of previous messages
export async function runGemini(prompt, history = []) {
    // (5a) Start a chat session with the given config and history
    const chatSession = model.startChat({
        generationConfig,
        history,
    });

    // (5b) Send the user's message
    const result = await chatSession.sendMessage(prompt);

    // (5c) Print or return the response text
    // console.log(result.response.text());
    return result.response.text();
}

interface VideoMetadata {
    title: string;
    description: string;
}

function isValidJson(text: string): boolean {
    try {
        JSON.parse(text);
        return true;
    } catch {
        return false;
    }
}

function validateResponse(json: any): VideoMetadata {
    let title = json.response?.title || '';
    let description = json.response?.description || '';

    // If the title is too long, it might actually be a description
    if (title.length > 100 && (!description || description.length < title.length)) {
        description = title;
        title = 'Untitled';
    }

    return {
        title: title || 'Untitled',
        description: description || 'No description.'
    };
}

function cleanAndParseGeminiResponse(responseText: string): VideoMetadata {
    // First try parsing as-is
    if (isValidJson(responseText)) {
        const json = JSON.parse(responseText);
        return validateResponse(json);
    }

    // If not valid JSON, clean it up
    let cleanText = responseText
        .replace(/```json\n?/g, '')  // Remove ```json
        .replace(/```\n?/g, '')      // Remove remaining ```
        .replace(/^\s*\n/gm, '')     // Remove empty lines
        .trim();                     // Remove extra whitespace

    // Try parsing the cleaned text
    try {
        const json = JSON.parse(cleanText);
        return validateResponse(json);
    } catch (parseErr) {
        console.warn('Failed to parse even after cleaning:', parseErr);
        return {title: 'Untitled', description: 'No description.'};
    }
}

export async function runGeminiForVideoMetadata(
    videoUrl: string,
    gsUri: string,
    directDownloadURL: string,
    context: string = 'baseball',
    style: string | null = null,
    gender: string | null = null,
    accent: string | null = null
): Promise<VideoMetadata> {

    // Simple config - no schema complexity
    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig,
        systemInstruction: `You are an ${context} knowledge AI that returns commentary for ${context}`,
    });

    try {
        const base64Data = await FileSystem.readAsStringAsync(videoUrl, {
            encoding: FileSystem.EncodingType.Base64
        });

        const prompt = `Create commentary for this video ${style ? `in a ${style} style` : ''}${gender ? `, from a ${gender} perspective` : ''}${accent ? `, with a ${accent} accent` : ''}.

I need TWO separate pieces of content:
1. A SHORT TITLE (one brief line summarizing the play)
2. A LONGER DESCRIPTION (2-3 sentences with details)

Return them in this EXACT format:
{
    "response": {
        "title": "ONE SHORT LINE ONLY - summarize the main action",
        "description": "2-3 FULL SENTENCES describing the play in detail"
    }
}`;



        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    {
                        inlineData: { data: base64Data,mimeType: 'video/mp4' },
                        //fileData: {fileUri: directDownloadURL,mimeType: "video/mp4"}
                    },
                    {
                        text: prompt
                    }
                ]
            }]
        });
        //const imagePart = {fileData: {mimeType: "video/mp4", fileUri: base64Data}};
        //const result = await model.generateContent([prompt, imagePart]);

        const responseText = result.response.candidates[0].content.parts[0].text;
        console.log('Response text:', responseText);

        return cleanAndParseGeminiResponse(responseText);

    } catch (err) {
        console.error('[runGeminiForVideoMetadata error]', err);
        return {title: 'Untitled', description: 'No description.'};
    }
}

// (6) Export your function for use elsewhere
module.exports = {runGemini, runGeminiForVideoMetadata};
