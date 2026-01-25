import React, { useState, useEffect } from 'react';
import { Trash2, Clock, FileText, Cpu, X, ChevronRight, AlertCircle } from 'lucide-react';
import { historyService, HistoryItem } from '../services/historyService';

interface HistorySettingsProps {
    isDarkMode: boolean;
}

export function HistorySettings({ isDarkMode }: HistorySettingsProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isEnabled, setIsEnabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        historyService.populateDummyData();
        loadData();
    }, []);

    const loadData = () => {
        setHistory(historyService.getHistory());
        setIsEnabled(historyService.isHistoryEnabled());
    };

    const handleToggleHistory = () => {
        const newState = !isEnabled;
        historyService.setHistoryEnabled(newState);
        setIsEnabled(newState);
    };

    const handleDeleteAll = () => {
        historyService.clearHistory();
        setHistory([]);
        setShowDeleteConfirm(false);
    };

    // Helper to format date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to truncate text
    const truncate = (text: string, length: number = 50) => {
        return text.length > length ? text.substring(0, length) + '...' : text;
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-[20px] text-slate-900 dark:text-white mb-1">校正履歴</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    過去の校正履歴を確認・管理できます。履歴の保存設定や一括削除も可能です。
                </p>
            </div>

            {/* Controls Section */}
            <div className={`rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'} p-5 mb-6`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                            履歴を保存する
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            校正した内容をローカルに保存します
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={handleToggleHistory}
                            className="sr-only peer"
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-colors duration-200 ${isEnabled
                                ? 'bg-blue-500'
                                : (isDarkMode ? 'bg-slate-600' : 'bg-slate-200')
                            }`} />
                        <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isEnabled ? 'translate-x-5' : ''
                            }`} />
                    </label>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="text-sm">
                            <span className="text-slate-500 dark:text-slate-400">保存済み履歴: </span>
                            <span className="font-medium text-slate-900 dark:text-white">{history.length} 件</span>
                        </div>
                    </div>

                    {history.length > 0 && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            履歴を削除
                        </button>
                    )}
                </div>
            </div>

            {/* History List */}
            <div className="space-y-3">
                {history.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>履歴はありません</p>
                    </div>
                ) : (
                    history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`group cursor-pointer rounded-lg border p-4 transition-all duration-200 ${isDarkMode
                                    ? 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/80'
                                    : 'border-slate-200 bg-white hover:shadow-sm hover:border-blue-300'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            {item.mode}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {formatDate(item.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 font-mono">
                                        {item.originalText}
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors mt-2" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
                    <div
                        className={`w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                            }`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold">履歴詳細</h3>
                            <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-60px)]">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                    <div className="text-xs text-slate-500 mb-1">日時</div>
                                    <div className="text-sm font-medium">{formatDate(selectedItem.timestamp)}</div>
                                </div>
                                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                    <div className="text-xs text-slate-500 mb-1">モード / モデル</div>
                                    <div className="text-sm font-medium">{selectedItem.mode} / {selectedItem.modelName}</div>
                                </div>
                                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                    <div className="text-xs text-slate-500 mb-1">文字数</div>
                                    <div className="text-sm font-medium">{selectedItem.metrics.charCount} 文字</div>
                                </div>
                                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                    <div className="text-xs text-slate-500 mb-1">処理時間</div>
                                    <div className="text-sm font-medium">{selectedItem.metrics.durationMs} ms</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium mb-2 text-slate-500">校正前</div>
                                    <div className={`p-4 rounded-lg font-mono text-sm whitespace-pre-wrap ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'
                                        }`}>
                                        {selectedItem.originalText}
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium mb-2 text-blue-500">校正後</div>
                                    <div className={`p-4 rounded-lg font-mono text-sm whitespace-pre-wrap ${isDarkMode ? 'bg-blue-900/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                                        }`}>
                                        {selectedItem.correctedText}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-sm rounded-xl shadow-xl p-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                        }`}>
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <AlertCircle className="w-6 h-6" />
                            <h3 className="font-semibold text-lg">履歴を削除しますか？</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            すべての校正履歴が削除されます。この操作は取り消せません。
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                                    }`}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                            >
                                削除する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
