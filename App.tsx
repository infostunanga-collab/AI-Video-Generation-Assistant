
import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import Loader from './components/Loader';
import { generateVideo } from './services/geminiService';
import { FilmIcon } from './components/icons';

const App: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [voiceText, setVoiceText] = useState<string>('');
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [watermark, setWatermark] = useState<string>('@Astuces Digitales');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleGenerateClick = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate a video.');
            return;
        }

        setError(null);
        setIsLoading(true);
        setGeneratedVideoUrl(null);

        try {
            let imagePayload: { file: File, base64: string } | null = null;
            if (referenceImage) {
                const base64Data = await fileToBase64(referenceImage);
                imagePayload = { file: referenceImage, base64: base64Data };
            }

            const videoUrl = await generateVideo(prompt, voiceText, imagePayload, setLoadingMessage, watermark, aspectRatio);
            setGeneratedVideoUrl(videoUrl);
        } catch (err: any) {
            console.error("Video generation error:", err);

            let displayMessage = "An error occurred during video generation. Please try again.";

            if (err && err.message) {
                // Attempt to parse a JSON object from the error message for more detailed feedback
                const jsonMatch = err.message.match(/{.*}/s);
                if (jsonMatch && jsonMatch[0]) {
                    try {
                        const errorDetails = JSON.parse(jsonMatch[0]);
                        const apiError = errorDetails.error || errorDetails;

                        if (apiError.status === 'RESOURCE_EXHAUSTED') {
                            displayMessage = "API Quota Exceeded: Your request could not be completed because the usage limit has been reached. Please check your Google AI project's quota and billing status for more information.";
                        } else if (apiError.message) {
                            displayMessage = `Video generation failed: ${apiError.message}`;
                        } else {
                            displayMessage = `An unexpected error occurred: ${err.message}`;
                        }
                    } catch (parseError) {
                        // The matched string wasn't valid JSON, so display the original error
                        displayMessage = `An error occurred during video generation: ${err.message}`;
                    }
                } else {
                    // No JSON found in the error, display as is
                    displayMessage = `An error occurred during video generation: ${err.message}`;
                }
            }
            setError(displayMessage);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, voiceText, referenceImage, watermark, aspectRatio]);
    
    const handleStartOver = () => {
        setPrompt('');
        setVoiceText('');
        setReferenceImage(null);
        setWatermark('@Astuces Digitales');
        setAspectRatio('16:9');
        setGeneratedVideoUrl(null);
        setError(null);
        setIsLoading(false);
    };

    const Header = () => (
        <header className="w-full max-w-5xl mx-auto p-4 flex items-center justify-center text-white">
            <FilmIcon />
            <h1 className="text-2xl sm:text-3xl font-bold ml-3 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                AI Video Generation Assistant
            </h1>
        </header>
    );

    const renderForm = () => (
        <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
             <div>
                <label htmlFor="prompt" className="block mb-2 text-sm font-medium text-gray-300">Prompt</label>
                <textarea
                    id="prompt"
                    rows={6}
                    className="block p-2.5 w-full text-sm text-gray-200 bg-gray-800 rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 transition"
                    placeholder="A high-resolution video of a majestic lion walking on a beach at sunset, cinematic style."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="voice" className="block mb-2 text-sm font-medium text-gray-300">Voice (Optional)</label>
                        <textarea
                            id="voice"
                            rows={3}
                            className="block p-2.5 w-full text-sm text-gray-200 bg-gray-800 rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 transition"
                            placeholder="Text to be spoken by the subject..."
                            value={voiceText}
                            onChange={(e) => setVoiceText(e.target.value)}
                        ></textarea>
                    </div>
                     <div>
                        <label htmlFor="watermark" className="block mb-2 text-sm font-medium text-gray-300">Watermark</label>
                        <input
                            id="watermark"
                            type="text"
                            className="block p-2.5 w-full text-sm text-gray-200 bg-gray-800 rounded-lg border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 transition"
                            placeholder="@YourBrand"
                            value={watermark}
                            onChange={(e) => setWatermark(e.target.value)}
                        />
                    </div>
                     <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Aspect Ratio</label>
                        <div className="flex gap-2">
                             <button onClick={() => setAspectRatio('16:9')} className={`w-full p-2.5 rounded-lg border text-sm font-medium transition-colors ${aspectRatio === '16:9' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}>16:9</button>
                             <button onClick={() => setAspectRatio('9:16')} className={`w-full p-2.5 rounded-lg border text-sm font-medium transition-colors ${aspectRatio === '9:16' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}>9:16</button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col">
                    <label className="block mb-2 text-sm font-medium text-gray-300">Reference Image (Optional)</label>
                     <ImageUploader onImageChange={setReferenceImage} />
                </div>
            </div>

            {error && <p className="text-red-400 text-center p-3 bg-red-900/50 rounded-md text-sm">{error}</p>}
            
            <button
                onClick={handleGenerateClick}
                disabled={isLoading || !prompt.trim()}
                className="w-full py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-900 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
            >
                {isLoading ? 'Generating...' : 'Generate Video'}
            </button>
        </div>
    );
    
    const renderResult = () => (
        <div className="w-full max-w-3xl mx-auto p-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Your Video is Ready!</h2>
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border-2 border-purple-500 shadow-lg shadow-purple-500/20">
              <video src={generatedVideoUrl!} controls autoPlay loop className="w-full h-full object-contain"></video>
            </div>
            <button
                onClick={handleStartOver}
                className="mt-8 py-3 px-8 text-base font-medium text-center text-white rounded-lg bg-gray-700 hover:bg-gray-600 focus:ring-4 focus:ring-gray-800 transition-all"
            >
                Create Another Video
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center">
            {isLoading && <Loader message={loadingMessage} />}
            <Header />
            <main className="w-full flex-grow flex items-center justify-center">
                {generatedVideoUrl ? renderResult() : renderForm()}
            </main>
            <footer className="w-full text-center p-4 text-gray-500 text-sm">
                Powered by Gemini AI
            </footer>
        </div>
    );
};

export default App;
