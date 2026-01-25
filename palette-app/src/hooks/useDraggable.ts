import { useCallback } from 'react';

export const useDraggable = ({
  x,
  y,
  onDrag,
  onStart
}: {
  x: number;
  y: number;
  onDrag: (x: number, y: number) => void;
  onStart?: () => void;
}) => {
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // If clicking on an input or textarea, don't initiate drag unless it's a specific handle
    // For this simple app, we'll assume the caller attaches this to a container
    // and we might need to stop propagation from inputs.
    // Actually, checking event target is safer.
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
    }

    // e.preventDefault(); // Prevents focus on some elements, be careful.
    // Usually for drag, we want to prevent default selection.

    onStart?.();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = x;
    const initialY = y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      onDrag(initialX + dx, initialY + dy);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [x, y, onDrag, onStart]);

  return { onMouseDown };
};
