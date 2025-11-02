import React, { useState, useCallback, useRef } from 'react';
import { generateComplaintResponse } from './services/geminiService';
import { SparklesIcon, SendIcon, ClipboardIcon, CheckIcon, AlertTriangleIcon, BotIcon, PaperclipIcon, XIcon } from './components/Icons';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


const App: React.FC = () => {
  const [complaint, setComplaint] = useState<string>('');
  const [coreAnswer, setCoreAnswer] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const responseRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Hanya file gambar (JPG, PNG, dll.) yang diperbolehkan.');
        return;
      }
      setError(null);
      setImageFile(file);
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageBase64(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!complaint.trim() && !imageFile) || !coreAnswer.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      let imagePart = null;
      if (imageFile && imageBase64) {
        imagePart = {
          inlineData: {
            data: imageBase64.split(',')[1],
            mimeType: imageFile.type,
          },
        };
      }
      
      const result = await generateComplaintResponse(complaint, coreAnswer, imagePart);
      setResponse(result);
      setTimeout(() => {
        responseRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError('Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [complaint, coreAnswer, isLoading, imageFile, imageBase64]);

  const handleCopyToClipboard = useCallback(() => {
    if (!response) return;
    navigator.clipboard.writeText(response).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [response]);
  
  const isSubmitDisabled = (!complaint.trim() && !imageBase64) || !coreAnswer.trim() || isLoading;

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <main className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4">
              <BotIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Asisten Layanan Pelanggan AI
            </h1>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
              AI akan membantu mengembangkan jawaban inti Anda menjadi respons yang formal dan solutif.
            </p>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8 transition-colors duration-300">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="complaint" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  1. Tuliskan keluhan atau lampirkan foto:
                </label>
                <textarea
                  id="complaint"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Contoh: Pesanan saya belum sampai padahal sudah lewat estimasi..."
                  className="w-full h-28 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                  disabled={isLoading}
                />
                <div className="mt-2">
                   <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isLoading}
                  />
                  {!imageBase64 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                      <PaperclipIcon className="h-4 w-4" />
                      Lampirkan Foto (Opsional)
                    </button>
                  )}
                  
                  {imageBase64 && (
                    <div className="relative inline-block mt-2 border dark:border-slate-600 p-1 rounded-lg">
                      <img src={imageBase64} alt="Pratinjau Komplain" className="rounded-md max-h-32 w-auto" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-slate-700 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        aria-label="Hapus gambar"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="coreAnswer" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  2. Masukkan inti jawaban Anda:
                </label>
                <textarea
                  id="coreAnswer"
                  value={coreAnswer}
                  onChange={(e) => setCoreAnswer(e.target.value)}
                  placeholder="Contoh: Kami akan kirim ulang barangnya hari ini juga."
                  className="w-full h-28 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="mt-6 text-right">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:dark:bg-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memproses</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    <span>Generate Jawaban</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg relative mb-8 flex items-center gap-3" role="alert">
            <AlertTriangleIcon className="h-5 w-5"/>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {(isLoading || response) && (
          <div ref={responseRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 transition-all duration-300 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <SparklesIcon className="h-6 w-6 text-blue-500" />
                Jawaban dari Asisten AI
              </h2>
              {response && !isLoading && (
                 <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
                >
                    {isCopied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
                    {isCopied ? 'Tersalin!' : 'Salin'}
                </button>
              )}
            </div>
            {isLoading && !response ? (
                 <div className="space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                 </div>
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
                {response}
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="w-full max-w-2xl mx-auto text-center py-6 mt-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dibuat dengan React, Tailwind CSS, dan Gemini API.
        </p>
      </footer>
    </div>
  );
};

export default App;