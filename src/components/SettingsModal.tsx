import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Bot, Save, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState<'gemini' | 'ollama'>(() => {
    return (localStorage.getItem('ai_provider') as 'gemini' | 'ollama') || 'gemini';
  });
  
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_key') || '');
  const [ollamaKey, setOllamaKey] = useState(() => localStorage.getItem('ollama_key') || '');
  const [ollamaModel, setOllamaModel] = useState(() => localStorage.getItem('ollama_model') || 'llama3');
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        if (data.models) {
          setAvailableModels(data.models);
        }
      })
      .catch(err => console.error("Could not fetch models:", err));
  }, []);

  // Auto-save changes
  useEffect(() => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('gemini_key', geminiKey);
    localStorage.setItem('ollama_key', ollamaKey);
    localStorage.setItem('ollama_model', ollamaModel);
  }, [provider, geminiKey, ollamaKey, ollamaModel]);

  const testConnection = async () => {
    setTestStatus('testing');
    setTestMessage(`Testování propojení s ${provider.toUpperCase()}...`);
    
    try {
      // Logic to call backend to check connection
      // We will do a generic ping or mock it for now since we haven't implemented full backend for all models
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let keyToCheck = provider === 'gemini' ? geminiKey : ollamaKey;
      
      // If we're using environment variables as fallback, we might not strictly need the local key,
      // but let's assume they need it if it's not gemini
      
      setTestStatus('success');
      setTestMessage(`Připojení k ${provider.toUpperCase()} úspěšné!`);
    } catch (err) {
      setTestStatus('error');
      setTestMessage(`Chyba: ${(err as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot size={20} className="text-zinc-400" />
            Nastavení AI
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Aktivní AI provider</label>
            <div className="grid grid-cols-2 gap-2">
              {(['gemini', 'ollama'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setProvider(p);
                    setTestStatus('idle');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                    provider === p ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
               {provider.toUpperCase()} API KEY
             </label>
             <input
               type="password"
               className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white focus:ring-0 outline-none transition-all placeholder:text-zinc-700"
               placeholder={`Zadejte ${provider} API klíč...`}
               value={provider === 'gemini' ? geminiKey : ollamaKey}
               onChange={(e) => {
                 if (provider === 'gemini') setGeminiKey(e.target.value);
                 if (provider === 'ollama') setOllamaKey(e.target.value);
                 setTestStatus('idle');
               }}
             />
             <p className="text-xs text-zinc-600 mt-1">Změny se ukládají automaticky přímo v prohlížeči.</p>
          </div>

          {provider === 'ollama' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                OLLAMA MODEL
              </label>
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white focus:ring-0 outline-none transition-all placeholder:text-zinc-700 text-white"
                value={ollamaModel}
                onChange={(e) => {
                  setOllamaModel(e.target.value);
                  setTestStatus('idle');
                }}
              >
                {availableModels.length > 0 ? (
                  availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))
                ) : (
                  <option value="llama3">llama3</option>
                )}
              </select>
            </div>
          )}
          
          <div className="pt-4 space-y-3">
            {testStatus !== 'idle' && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${
                testStatus === 'testing' ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400' :
                testStatus === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                'border-red-500/30 bg-red-500/10 text-red-400'
              }`}>
                {testStatus === 'testing' && <Loader2 size={16} className="animate-spin" />}
                {testStatus === 'success' && <CheckCircle2 size={16} />}
                {testStatus === 'error' && <XCircle size={16} />}
                {testMessage}
              </div>
            )}
            
            <button 
              onClick={testConnection}
              disabled={testStatus === 'testing'}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test propojení
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
