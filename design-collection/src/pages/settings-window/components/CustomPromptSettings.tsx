import { useState } from 'react';
import { Plus, Trash2, Edit2, MoreHorizontal, Command, Terminal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';

interface CustomPromptSettingsProps {
    isDarkMode: boolean;
}

interface Prompt {
    id: string;
    title: string;
    body: string;
    shortcut: string;
}

export function CustomPromptSettings({ isDarkMode }: CustomPromptSettingsProps) {
    const [prompts, setPrompts] = useState<Prompt[]>([
        {
            id: '1',
            title: '要約',
            body: '以下の文章を要約してください。重要なポイントを3つに絞って箇条書きにしてください。',
            shortcut: 'Cmd+Shift+S'
        },
        {
            id: '2',
            title: '校正（ビジネス）',
            body: '以下の文章をビジネスメールとして適切な敬語や表現に修正してください。誤字脱字もチェックしてください。',
            shortcut: 'Cmd+Shift+B'
        },
        {
            id: '3',
            title: 'コードレビュー（詳細）',
            body: '以下のコードをレビューしてください。以下の観点を含めて詳細に分析をお願いします。\n\n1. バグや潜在的な問題点\n2. パフォーマンスの改善点（計算量、メモリ使用量など）\n3. 可読性と保守性（命名規則、コメント、構造化）\n4. セキュリティ上の懸念事項\n5. ベストプラクティスへの準拠\n\nまた、修正案がある場合は、具体的なコード例を示して説明してください。特に、エッジケースの考慮が不足している箇所があれば指摘してください。',
            shortcut: ''
        }
    ]);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingBody, setEditingBody] = useState('');
    const [editingShortcut, setEditingShortcut] = useState('');

    const handleAddPrompt = () => {
        setEditingTitle('');
        setEditingBody('');
        setEditingShortcut('');
        setIsAddDialogOpen(true);
    };

    const handleSaveNewPrompt = () => {
        if (!editingTitle || !editingBody) return;

        const newPrompt: Prompt = {
            id: Date.now().toString(),
            title: editingTitle,
            body: editingBody,
            shortcut: editingShortcut
        };

        setPrompts([...prompts, newPrompt]);
        setIsAddDialogOpen(false);
    };

    const handleViewPrompt = (prompt: Prompt) => {
        setCurrentPrompt(prompt);
        setIsViewDialogOpen(true);
    };

    const handleEditPrompt = (prompt: Prompt) => {
        setCurrentPrompt(prompt);
        setEditingTitle(prompt.title);
        setEditingBody(prompt.body);
        setEditingShortcut(prompt.shortcut);
        setIsEditDialogOpen(true);
    };

    const handleSaveEditPrompt = () => {
        if (!currentPrompt || !editingTitle || !editingBody) return;

        const updatedPrompts = prompts.map(p =>
            p.id === currentPrompt.id
                ? { ...p, title: editingTitle, body: editingBody, shortcut: editingShortcut }
                : p
        );

        setPrompts(updatedPrompts);
        setIsEditDialogOpen(false);
        setCurrentPrompt(null);
    };

    const handleDeletePrompt = (id: string) => {
        setPrompts(prompts.filter(p => p.id !== id));
    };

    return (
        <div className="p-6 pb-10">
            <h1 className="text-[20px] text-slate-500 dark:text-slate-400 font-light mb-1">カスタムプロンプト</h1>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-6">
                独自のプロンプトを作成してショートカットを割り当てることができます。
            </p>

            {/* Add Button */}
            <button
                onClick={handleAddPrompt}
                className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[13px] font-medium transition-colors shadow-sm"
            >
                <Plus className="w-4 h-4" />
                新しいプロンプトを追加
            </button>

            {/* Prompt List */}
            <div className="grid gap-4">
                {prompts.map((prompt) => (
                    <div
                        key={prompt.id}
                        className="group bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div
                                className="flex-1 cursor-pointer"
                                onClick={() => handleViewPrompt(prompt)}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-[15px] font-medium text-slate-900 dark:text-white">
                                        {prompt.title}
                                    </h3>
                                    {prompt.shortcut && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                            <Command className="w-3 h-3" />
                                            {prompt.shortcut}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {prompt.body}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEditPrompt(prompt)}
                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="編集"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeletePrompt(prompt.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="削除"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {prompts.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Terminal className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-[13px]">プロンプトがありません</p>
                    </div>
                )}
            </div>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">新しいプロンプトを追加</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            よく使うプロンプトを登録して、素早く呼び出せるようにします。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                タイトル
                            </label>
                            <input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                placeholder="例: 要約、翻訳、校正など"
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                プロンプト本文
                            </label>
                            <textarea
                                value={editingBody}
                                onChange={(e) => setEditingBody(e.target.value)}
                                placeholder="AIへの指示を入力してください..."
                                className="w-full h-32 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                ショートカット（任意）
                            </label>
                            <input
                                value={editingShortcut}
                                onChange={(e) => setEditingShortcut(e.target.value)}
                                placeholder="例: Cmd+Shift+P"
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsAddDialogOpen(false)}
                            className="px-4 py-2 text-[13px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSaveNewPrompt}
                            disabled={!editingTitle || !editingBody}
                            className="px-4 py-2 text-[13px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            保存
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">プロンプトを編集</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                タイトル
                            </label>
                            <input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                プロンプト本文
                            </label>
                            <textarea
                                value={editingBody}
                                onChange={(e) => setEditingBody(e.target.value)}
                                className="w-full h-32 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                ショートカット
                            </label>
                            <input
                                value={editingShortcut}
                                onChange={(e) => setEditingShortcut(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsEditDialogOpen(false)}
                            className="px-4 py-2 text-[13px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSaveEditPrompt}
                            disabled={!editingTitle || !editingBody}
                            className="px-4 py-2 text-[13px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            保存
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-3">
                            {currentPrompt?.title}
                            {currentPrompt?.shortcut && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-normal bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    <Command className="w-3 h-3" />
                                    {currentPrompt.shortcut}
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 max-h-[60vh] overflow-y-auto">
                            <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                                {currentPrompt?.body}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsViewDialogOpen(false)}
                            className="px-4 py-2 text-[13px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                        >
                            閉じる
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
