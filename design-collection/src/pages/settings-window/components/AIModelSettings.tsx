import { useState } from 'react';
import { Key, ExternalLink, RefreshCw, CheckCircle2, XCircle, Server } from 'lucide-react';

interface AIModelSettingsProps {
    isDarkMode: boolean;
}

interface OllamaModel {
    name: string;
    size: number;
    digest: string;
    details: {
        family: string;
        parameter_size: string;
        quantization_level: string;
    };
}

export function AIModelSettings({ isDarkMode }: AIModelSettingsProps) {
    // BYOK State
    const [useCustomGemini, setUseCustomGemini] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState('');

    // Ollama State
    const [useOllama, setUseOllama] = useState(false);
    const [ollamaServerUrl, setOllamaServerUrl] = useState('http://localhost:11434');
    const [isCheckingConnection, setIsCheckingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
    const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
    const [selectedModel, setSelectedModel] = useState('');

    const handleUseCustomGeminiChange = (enabled: boolean) => {
        setUseCustomGemini(enabled);
        if (enabled) {
            setUseOllama(false);
        }
    };

    const handleUseOllamaChange = (enabled: boolean) => {
        setUseOllama(enabled);
        if (enabled) {
            setUseCustomGemini(false);
        }
    };

    const checkOllamaConnection = async () => {
        setIsCheckingConnection(true);
        setConnectionStatus('unknown');
        try {
            // First check if server is up
            const response = await fetch(`${ollamaServerUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                setAvailableModels(data.models || []);
                setConnectionStatus('connected');
                if (data.models?.length > 0 && !selectedModel) {
                    setSelectedModel(data.models[0].name);
                }
            } else {
                setConnectionStatus('disconnected');
            }
        } catch (error) {
            console.error('Ollama connection error:', error);
            setConnectionStatus('disconnected');
        } finally {
            setIsCheckingConnection(false);
        }
    };

    // Initial check on mount if URL is present (optional, maybe better to wait for user action or debounce)
    // useEffect(() => { checkOllamaConnection(); }, []);

    return (
        <div className="p-6 pb-10">
            <h1 className="text-[20px] text-slate-500 dark:text-slate-400 font-light mb-1">AIモデル</h1>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-6">
                校正に使用するAIモデルの設定を行います。
            </p>

            {/* BYOK Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] text-slate-900 dark:text-white font-medium flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-500" />
                        Gemini API Key (BYOK)
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400">
                            {useCustomGemini ? '有効' : '無効'}
                        </span>
                        <button
                            onClick={() => handleUseCustomGeminiChange(!useCustomGemini)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${useCustomGemini ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useCustomGemini ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
                    Google AI Studioで取得したAPI Keyを使用して、Geminiモデルを利用します。
                </p>

                <div className={`transition-all duration-300 ${useCustomGemini ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="mb-4">
                            <label className="block text-[12px] text-slate-500 dark:text-slate-400 mb-2">
                                API Key
                            </label>
                            <input
                                type="password"
                                value={geminiApiKey}
                                onChange={(e) => setGeminiApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 font-mono"
                            />
                        </div>
                        <div className="flex justify-end">
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                                API Keyを取得する <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ollama Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] text-slate-900 dark:text-white font-medium flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-500" />
                        ローカルLLM (Ollama)
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400">
                            {useOllama ? '有効' : '無効'}
                        </span>
                        <button
                            onClick={() => handleUseOllamaChange(!useOllama)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${useOllama ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useOllama ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
                    Ollamaを使用して、ローカル環境で動作するLLMを利用できます。プライバシーを重視する場合や、オフラインで利用したい場合に適しています。
                </p>

                <div className={`transition-all duration-300 ${useOllama ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60">
                        {/* Server URL */}
                        <div className="mb-6">
                            <label className="block text-[12px] text-slate-500 dark:text-slate-400 mb-2">
                                Ollama Server URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={ollamaServerUrl}
                                    onChange={(e) => setOllamaServerUrl(e.target.value)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 font-mono"
                                />
                                <button
                                    onClick={checkOllamaConnection}
                                    disabled={isCheckingConnection}
                                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[13px] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                                >
                                    {isCheckingConnection ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    接続確認
                                </button>
                            </div>
                        </div>

                        {/* Connection Status */}
                        <div className="mb-6 flex items-center gap-2">
                            <span className="text-[12px] text-slate-500 dark:text-slate-400">ステータス:</span>
                            {connectionStatus === 'connected' && (
                                <span className="text-[12px] text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> 接続済み
                                </span>
                            )}
                            {connectionStatus === 'disconnected' && (
                                <span className="text-[12px] text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                                    <XCircle className="w-4 h-4" /> 接続失敗
                                </span>
                            )}
                            {connectionStatus === 'unknown' && (
                                <span className="text-[12px] text-slate-400 dark:text-slate-500">
                                    未確認
                                </span>
                            )}
                        </div>

                        {/* Model Selection (Visible only when connected) */}
                        {connectionStatus === 'connected' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-[12px] text-slate-500 dark:text-slate-400 mb-2">
                                    使用するモデル
                                </label>
                                {availableModels.length > 0 ? (
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
                                    >
                                        {availableModels.map((model) => (
                                            <option key={model.name} value={model.name}>
                                                {model.name} ({Math.round(model.size / 1024 / 1024 / 1024 * 100) / 100} GB)
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-[13px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                                        利用可能なモデルが見つかりません。Ollamaでモデルをpullしてください。
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Download Guide (Visible when disconnected or unknown) */}
                        {connectionStatus !== 'connected' && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                                <p className="text-[12px] text-slate-600 dark:text-slate-300 mb-2">
                                    Ollamaがインストールされていない、または起動していない可能性があります。
                                </p>
                                <a
                                    href="https://ollama.com/download"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[12px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 inline-flex"
                                >
                                    Ollama公式サイトからダウンロード <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
