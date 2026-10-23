import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo
} from 'lucide-react';

interface MenuBarProps {
  editor: any;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/40 select-none">
      {/* Bold */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all dashboard-interactive ${
          editor.isActive('bold')
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Negrita"
      >
        <Bold size={15} />
      </button>

      {/* Italic */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all dashboard-interactive ${
          editor.isActive('italic')
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Cursiva"
      >
        <Italic size={15} />
      </button>

      <div className="w-[1px] h-5 bg-border mx-1" />

      {/* Heading 1 */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all dashboard-interactive ${
          editor.isActive('heading', { level: 1 })
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Encabezado H1"
      >
        <Heading1 size={15} />
        <span className="text-[11px]">H1</span>
      </button>

      {/* Heading 2 */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all dashboard-interactive ${
          editor.isActive('heading', { level: 2 })
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Encabezado H2"
      >
        <Heading2 size={15} />
        <span className="text-[11px]">H2</span>
      </button>

      <div className="w-[1px] h-5 bg-border mx-1" />

      {/* Bullet List */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all dashboard-interactive ${
          editor.isActive('bulletList')
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Lista con viñetas / puntos"
      >
        <List size={15} />
        <span className="text-[11px] font-semibold">Viñetas</span>
      </button>

      {/* Ordered List */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all dashboard-interactive ${
          editor.isActive('orderedList')
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Lista con números"
      >
        <ListOrdered size={15} />
        <span className="text-[11px] font-semibold">Numeración</span>
      </button>

      <div className="w-[1px] h-5 bg-border mx-1" />

      {/* Blockquote */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all dashboard-interactive ${
          editor.isActive('blockquote')
            ? 'bg-primary text-white shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Cita destacada"
      >
        <Quote size={15} />
      </button>

      <div className="w-[1px] h-5 bg-border mx-1" />

      {/* Undo */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent dashboard-interactive"
        title="Deshacer"
      >
        <Undo size={15} />
      </button>

      {/* Redo */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent dashboard-interactive"
        title="Rehacer"
      >
        <Redo size={15} />
      </button>
    </div>
  );
};

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2]
        }
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap p-4 focus:outline-none min-h-[220px] text-foreground'
      }
    }
  });

  return (
    <div
      className="border border-input rounded-xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring transition-colors cursor-text text-foreground"
      onClick={() => {
        if (editor && !editor.isFocused) {
          editor.chain().focus().run();
        }
      }}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
