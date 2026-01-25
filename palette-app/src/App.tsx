import React, { useRef, useState } from 'react';
import { useBoard } from './hooks/useBoard';
import { Board } from './components/Board';
import { Plus, Image as ImageIcon, Download, X } from 'lucide-react';

function App() {
  const { items, addSticky, addImage, updateItem, deleteItem, bringToFront } = useBoard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExport, setShowExport] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addImage(e.target.files[0]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getMarkdown = () => {
    let md = "## Board Export\n\n";
    items.forEach(item => {
      if (item.type === 'sticky') {
        md += `- **Sticky** at (${Math.round(item.x)}, ${Math.round(item.y)})\n`;
        md += `  ${(item.content || '').replace(/\n/g, '\n  ')}\n\n`;
      } else if (item.type === 'image') {
        md += `- **Image** at (${Math.round(item.x)}, ${Math.round(item.y)})\n`;
        // Truncate data URL for readability in export or just say [Image]
        md += `  [Image Data]\n\n`;
      }
    });
    return md;
  };

  return (
    <div className="flex flex-col h-screen w-screen text-gray-800 font-sans">
      {/* Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shadow-sm z-50">
        <h1 className="font-bold text-lg mr-4 tracking-tight">Palette</h1>

        <button
          onClick={addSticky}
          className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded-md transition-colors text-sm font-medium cursor-pointer"
        >
          <Plus size={16} /> Sticky
        </button>

        <button
          onClick={handleImageClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-md transition-colors text-sm font-medium cursor-pointer"
        >
          <ImageIcon size={16} /> Image
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        <div className="flex-1" />

        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors text-sm cursor-pointer"
        >
          <Download size={16} /> Export
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 relative overflow-hidden">
        <Board
          items={items}
          onUpdate={updateItem}
          onDelete={deleteItem}
          onFocus={bringToFront}
        />
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">Export Markdown</h2>
              <button onClick={() => setShowExport(false)} className="p-1 hover:bg-gray-100 rounded cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <pre className="w-full h-full bg-gray-50 p-4 rounded border text-sm overflow-auto whitespace-pre-wrap font-mono select-all">
                {getMarkdown()}
              </pre>
            </div>
            <div className="p-4 border-t flex justify-end">
                <button
                    onClick={() => { navigator.clipboard.writeText(getMarkdown()); alert('Copied!'); }}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm cursor-pointer"
                >
                    Copy to Clipboard
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
