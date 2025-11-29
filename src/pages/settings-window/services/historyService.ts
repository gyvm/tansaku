export interface HistoryItem {
    id: string;
    timestamp: number;
    originalText: string;
    correctedText: string;
    mode: string; // e.g., "Normal", "Strict", or Custom Prompt Title
    modelName: string;
    metrics: {
        durationMs: number;
        charCount: number;
        tokenCount?: number;
    };
}

const STORAGE_KEY_HISTORY = 'typozero_history';
const STORAGE_KEY_ENABLED = 'typozero_history_enabled';

export const historyService = {
    getHistory(): HistoryItem[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load history:', e);
            return [];
        }
    },

    addHistory(item: HistoryItem): void {
        if (!this.isHistoryEnabled()) return;

        try {
            const history = this.getHistory();
            // Add to beginning
            history.unshift(item);
            // Optional: Limit history size (e.g., 100 items) to prevent storage overflow
            if (history.length > 100) {
                history.length = 100;
            }
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    },

    clearHistory(): void {
        localStorage.removeItem(STORAGE_KEY_HISTORY);
    },

    isHistoryEnabled(): boolean {
        return localStorage.getItem(STORAGE_KEY_ENABLED) !== 'false'; // Default to true
    },

    setHistoryEnabled(enabled: boolean): void {
        localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
    },

    getHistoryCount(): number {
        return this.getHistory().length;
    },

    populateDummyData(): void {
        if (this.getHistory().length === 0) {
            const DUMMY_DATA: HistoryItem[] = [
                {
                    id: 'dummy-1',
                    timestamp: Date.now() - 1000 * 60 * 60 * 2,
                    originalText: 'この文章はダミーです。校正のテストを行っています。誤字脱字があるかもしれません。',
                    correctedText: 'この文章はダミーです。校正のテストを行っています。誤字脱字があるかもしれません。',
                    mode: 'Normal',
                    modelName: 'GPT-4o',
                    metrics: {
                        durationMs: 1200,
                        charCount: 45,
                        tokenCount: 30
                    }
                },
                {
                    id: 'dummy-2',
                    timestamp: Date.now() - 1000 * 60 * 60 * 24,
                    originalText: '昨日は雨が降っていたので、家で本を読んでいました。とても面白かったです。',
                    correctedText: '昨日は雨が降っていたので、家で本を読んでいました。とても面白かったです。',
                    mode: 'Strict',
                    modelName: 'Claude 3.5 Sonnet',
                    metrics: {
                        durationMs: 800,
                        charCount: 38,
                        tokenCount: 25
                    }
                },
                {
                    id: 'dummy-3',
                    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
                    originalText: 'プレゼンテーションの資料作成におわれて、時間がありません。手伝ってください。',
                    correctedText: 'プレゼンテーションの資料作成に追われて、時間がありません。手伝ってください。',
                    mode: 'Custom: Business',
                    modelName: 'Gemini 1.5 Pro',
                    metrics: {
                        durationMs: 1500,
                        charCount: 42,
                        tokenCount: 28
                    }
                }
            ];
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(DUMMY_DATA));
        }
    }
};
