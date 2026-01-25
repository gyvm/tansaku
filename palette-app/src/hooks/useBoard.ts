import { useState, useEffect, useCallback } from 'react';
import type { BoardItem } from '../types';

const STORAGE_KEY = 'palette-app-data';

export const useBoard = () => {
  const [items, setItems] = useState<BoardItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load board data", e);
      return [];
    }
  });

  // Auto-save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addSticky = useCallback(() => {
    const newItem: BoardItem = {
      id: crypto.randomUUID(),
      type: 'sticky',
      x: 50 + Math.random() * 50,
      y: 50 + Math.random() * 50,
      w: 240,
      h: 240,
      z: Date.now(),
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const addImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Create an image element to get natural dimensions if we wanted,
        // but for now we'll just stick to a default width.
        const newItem: BoardItem = {
          id: crypto.randomUUID(),
          type: 'image',
          x: 100 + Math.random() * 50,
          y: 100 + Math.random() * 50,
          w: 200,
          h: 200, // Placeholder
          z: Date.now(),
          imageSrc: result,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setItems(prev => [...prev, newItem]);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const updateItem = useCallback((id: string, changes: Partial<BoardItem>) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...changes, updatedAt: Date.now() } : item
    ));
  }, []);

  const bringToFront = useCallback((id: string) => {
    setItems(prev => {
        const maxZ = prev.length > 0 ? Math.max(...prev.map(i => i.z)) : 0;
        return prev.map(item =>
            item.id === id ? { ...item, z: maxZ + 1 } : item
        );
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
      setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return {
    items,
    addSticky,
    addImage,
    updateItem,
    bringToFront,
    deleteItem
  };
};
