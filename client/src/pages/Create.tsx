import React, { useState } from 'react';
import { Sparkles, Send, Share2 } from 'lucide-react';
import axios from 'axios';

const Create = () => {
  const [prompt, setPrompt] = useState('');
  const [author, setAuthor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedImageUrl(null);

    try {
      // 1. Submit the job to the server
      const response = await axios.post('http://localhost:5000/api/generate', {
        prompt,
        author,
      });

      const { jobId } = response.data;

      // 2. Poll for job status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`http://localhost:5000/api/status/${jobId}`);
          const job = statusResponse.data;

          if (job.status === 'completed') {
            setGeneratedImageUrl(job.imageUrl);
            setIsGenerating(false);
            clearInterval(pollInterval);
          } else if (job.status === 'failed') {
            alert(`Generation failed: ${job.error}`);
            setIsGenerating(false);
            clearInterval(pollInterval);
          }
          // If still processing or pending, continue polling
        } catch (error) {
          console.error('Error polling status:', error);
          setIsGenerating(false);
          clearInterval(pollInterval);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error: any) {
      console.error('Error generating image:', error);
      alert(`Failed to start generation: ${error.response?.data?.error || error.message}`);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen text-white">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Create something extraordinary
        </h1>
        <p className="text-gray-400 mt-2">Enter a prompt and let Kafka & AI do the heavy lifting.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-md">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Aashish Tharu"
                className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">AI Prompt</label>
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to see..."
                className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isGenerating ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                }`}
            >
              {isGenerating ? (
                <>Building in Kafka...</>
              ) : (
                <><Sparkles size={20} /> Generate Image</>
              )}
            </button>
          </form>
        </section>

        <section className="flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/20 p-4">
          {generatedImageUrl ? (
            <div className="space-y-4 w-full">
              <img src={generatedImageUrl} alt="Generated" className="w-full h-auto rounded-lg shadow-2xl" />
              <button className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all">
                <Share2 size={18} /> Publish to Explore
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="mb-4 flex justify-center text-gray-700">
                <Sparkles size={60} />
              </div>
              <p>Your masterpiece will appear here</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Create;