import { useState } from 'react';
import { Plus, Edit2, ArrowRight, BookA, RefreshCw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Switch } from './ui/switch';

interface DictionarySettingsProps {
    isDarkMode: boolean;
}

interface DictionaryWord {
    id: string;
    word: string;
}

interface ReplacementRule {
    id: string;
    source: string;
    target: string;
    isEnabled: boolean;
}

export function DictionarySettings({ isDarkMode }: DictionarySettingsProps) {
    // Custom Dictionary State
    const [words, setWords] = useState<DictionaryWord[]>([
        { id: '1', word: 'fadsa' }
    ]);
    const [newWord, setNewWord] = useState('');
    const [editingWordId, setEditingWordId] = useState<string | null>(null);
    const [editingWordValue, setEditingWordValue] = useState('');

    // Replacement Rules State
    const [rules, setRules] = useState<ReplacementRule[]>([
        { id: '1', source: 'ご角煮お願いいたします。', target: 'ご確認お願いいたします。', isEnabled: true }
    ]);
    const [isRuleEnabled, setIsRuleEnabled] = useState(false);
    const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
    const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState<ReplacementRule | null>(null);
    const [newRuleSource, setNewRuleSource] = useState('');
    const [newRuleTarget, setNewRuleTarget] = useState('');

    // Dictionary Handlers
    const handleAddWord = () => {
        if (!newWord.trim()) return;
        const wordsToAdd = newWord.split(',').map(w => w.trim()).filter(w => w);
        const newWords = wordsToAdd.map(w => ({
            id: Date.now().toString() + Math.random().toString(),
            word: w
        }));
        setWords([...words, ...newWords]);
        setNewWord('');
    };

    const handleDeleteWord = (id: string) => {
        setWords(words.filter(w => w.id !== id));
    };

    const startEditWord = (word: DictionaryWord) => {
        setEditingWordId(word.id);
        setEditingWordValue(word.word);
    };

    const saveEditWord = () => {
        if (!editingWordValue.trim()) return;
        setWords(words.map(w => w.id === editingWordId ? { ...w, word: editingWordValue } : w));
        setEditingWordId(null);
        setEditingWordValue('');
    };

    const cancelEditWord = () => {
        setEditingWordId(null);
        setEditingWordValue('');
    };

    // Rule Handlers
    const handleAddRule = () => {
        setNewRuleSource('');
        setNewRuleTarget('');
        setIsAddRuleDialogOpen(true);
    };

    const saveNewRule = () => {
        if (!newRuleSource.trim() || !newRuleTarget.trim()) return;
        const newRule: ReplacementRule = {
            id: Date.now().toString(),
            source: newRuleSource,
            target: newRuleTarget,
            isEnabled: true
        };
        setRules([...rules, newRule]);
        setIsAddRuleDialogOpen(false);
    };

    const startEditRule = (rule: ReplacementRule) => {
        setCurrentRule(rule);
        setNewRuleSource(rule.source);
        setNewRuleTarget(rule.target);
        setIsEditRuleDialogOpen(true);
    };

    const saveEditRule = () => {
        if (!currentRule || !newRuleSource.trim() || !newRuleTarget.trim()) return;
        setRules(rules.map(r => r.id === currentRule.id ? { ...r, source: newRuleSource, target: newRuleTarget } : r));
        setIsEditRuleDialogOpen(false);
        setCurrentRule(null);
    };

    const handleDeleteRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    const toggleRule = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    };

    return (
        <div className="p-6 pb-10">
            <h1 className="text-[20px] text-slate-500 dark:text-slate-400 font-light mb-1">辞書・置換</h1>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-6">
                よく利用する単語を登録したり、置換ルールを設定できます。
            </p>

            {/* Custom Dictionary Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] text-slate-900 dark:text-white font-medium flex items-center gap-2">
                        <BookA className="w-4 h-4 text-slate-500" />
                        カスタム辞書
                    </h3>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
                    誤修正を避けたい単語を登録します。複数の単語はカンマで区切ってください。
                </p>

                <div className="space-y-4">
                    <div>
                        <div className="flex gap-2">
                            <input
                                value={newWord}
                                onChange={(e) => setNewWord(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                                placeholder="単語を入力"
                                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleAddWord}
                                disabled={!newWord.trim()}
                                className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" />
                                追加
                            </button>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                            Return キーまたは「追加」ボタンで保存します。
                        </p>
                    </div>

                    <div>
                        <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                            登録済みの単語
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                            {words.map((word) => (
                                <div key={word.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {editingWordId === word.id ? (
                                        <div className="flex items-center gap-2 flex-1 mr-4">
                                            <input
                                                value={editingWordValue}
                                                onChange={(e) => setEditingWordValue(e.target.value)}
                                                className="flex-1 px-2 py-1 rounded border border-blue-300 dark:border-blue-700 text-[13px] bg-white dark:bg-slate-800"
                                                autoFocus
                                            />
                                            <button onClick={saveEditWord} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Plus className="w-4 h-4" /></button>
                                            <button onClick={cancelEditWord} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <span className="text-[13px] text-slate-700 dark:text-slate-300 font-medium truncate max-w-[300px]">
                                            {word.word}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => startEditWord(word)}
                                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteWord(word.id)}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 bg-slate-400 text-white rounded-full p-0.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {words.length === 0 && (
                                <div className="p-4 text-center text-[13px] text-slate-400 dark:text-slate-500">
                                    登録された単語はありません
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Replacement Rules Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] text-slate-900 dark:text-white font-medium flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                        置換ルール
                    </h3>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isRuleEnabled}
                            onCheckedChange={setIsRuleEnabled}
                        />
                    </div>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
                    特定のテキストを別のテキストに自動的に置き換えるルールを設定します。
                </p>

                <div className={`transition-all duration-300 ${isRuleEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleAddRule}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[13px] font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            ルールを追加
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                        {rules.map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                                    <Switch
                                        checked={rule.isEnabled}
                                        onCheckedChange={() => toggleRule(rule.id)}
                                        className="data-[state=checked]:bg-blue-500"
                                    />
                                    <div className="flex items-center gap-3 flex-1 min-w-0 text-[13px]">
                                        <span className="truncate text-slate-900 dark:text-white font-medium" title={rule.source}>
                                            {rule.source}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        <span className="truncate text-slate-900 dark:text-white font-medium" title={rule.target}>
                                            {rule.target}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => startEditRule(rule)}
                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4 bg-slate-400 text-white rounded-full p-0.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {rules.length === 0 && (
                            <div className="p-4 text-center text-[13px] text-slate-400 dark:text-slate-500">
                                登録されたルールはありません
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Rule Dialog */}
            <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">新しい置換ルールを追加</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            特定のテキストを別のテキストに自動的に置き換えるルールを作成します。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                置換元のテキスト
                            </label>
                            <input
                                value={newRuleSource}
                                onChange={(e) => setNewRuleSource(e.target.value)}
                                placeholder="例: 誤字脱字"
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-center">
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                置換後のテキスト
                            </label>
                            <input
                                value={newRuleTarget}
                                onChange={(e) => setNewRuleTarget(e.target.value)}
                                placeholder="例: 正しい表現"
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsAddRuleDialogOpen(false)}
                            className="px-4 py-2 text-[13px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={saveNewRule}
                            disabled={!newRuleSource.trim() || !newRuleTarget.trim()}
                            className="px-4 py-2 text-[13px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            保存
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Rule Dialog */}
            <Dialog open={isEditRuleDialogOpen} onOpenChange={setIsEditRuleDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">置換ルールを編集</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                置換元のテキスト
                            </label>
                            <input
                                value={newRuleSource}
                                onChange={(e) => setNewRuleSource(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-center">
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                置換後のテキスト
                            </label>
                            <input
                                value={newRuleTarget}
                                onChange={(e) => setNewRuleTarget(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsEditRuleDialogOpen(false)}
                            className="px-4 py-2 text-[13px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={saveEditRule}
                            disabled={!newRuleSource.trim() || !newRuleTarget.trim()}
                            className="px-4 py-2 text-[13px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            保存
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
