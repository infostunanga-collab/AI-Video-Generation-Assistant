
// FIX: Removed `GenerateVideosRequest` as it is not an exported member of '@google/genai'.
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const loadingMessages = [
    "Warming up the digital director's chair...",
    "Assembling the pixels...",
    "Choreographing the photons...",
    "Teaching the AI about cinematography...",
    "Rendering the digital dreamscape...",
    "This can take a few minutes, the magic is in the making!",
    "Polishing the final cut...",
    "Adding sound and fury..."
];

const getMimeType = (file: File): string => {
    if (file.type) {
        return file.type;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'webp': return 'image/webp';
        default: return 'image/png';
    }
}

export const generateVideo = async (
    prompt: string,
    voiceText: string,
    image: { file: File, base64: string } | null,
    updateLoadingMessage: (message: string) => void,
    watermark: string,
    aspectRatio: '16:9' | '9:16'
): Promise<string> => {
    let fullPrompt = prompt;
    if (voiceText) {
        fullPrompt += ` The subject should say the following with synchronized lip movement: "${voiceText}"`;
    }
    if (watermark) {
        fullPrompt += ` A watermark with the text "${watermark}" should be added to the bottom right corner of the video.`;
    }

    // FIX: Replaced `GenerateVideosRequest` type and object mutation with a single inline object for `generateVideos`.
    // This resolves the type error and handles optional properties cleanly.
    updateLoadingMessage(loadingMessages[0]);
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfVideos: 1,
            aspectRatio: aspectRatio,
        },
        ...(image && {
            image: {
                imageBytes: image.base64,
                mimeType: getMimeType(image.file),
            },
        }),
    });
    
    let messageIndex = 0;

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        updateLoadingMessage(loadingMessages[messageIndex]);
        
        try {
            operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch(e) {
            console.error("Polling failed, retrying...", e);
            // continue polling
        }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed: No download link found in the final response.");
    }

    updateLoadingMessage("Downloading your masterpiece...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY!}`);
    if (!response.ok) {
        throw new Error(`Failed to download video. Status: ${response.status}. ${await response.text()}`);
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};
