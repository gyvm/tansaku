import { Store } from '@tauri-apps/plugin-store';

// Check if running in Tauri
// @ts-ignore
const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

let store: Store | null = null;

export async function initStorage() {
    if (isTauri && !store) {
        try {
            store = await Store.load('settings.json');
        } catch (e) {
            console.error("Failed to initialize Tauri store", e);
        }
    }
}

export async function getItem<T>(key: string): Promise<T | null> {
    if (store) {
        try {
            const val = await store.get<T>(key);
            return val ?? null;
        } catch (e) {
            console.error("Error getting item from store", e);
            return null;
        }
    } else {
        const val = localStorage.getItem(key);
        try {
            return val ? JSON.parse(val) : null;
        } catch {
            return null;
        }
    }
}

export async function setItem(key: string, value: any) {
    if (store) {
        try {
            await store.set(key, value);
            await store.save();
        } catch (e) {
            console.error("Error setting item in store", e);
        }
    } else {
        localStorage.setItem(key, JSON.stringify(value));
    }
}
