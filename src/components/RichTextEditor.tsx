import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
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

/**
 * Custom Tiptap extension that adds `listType` ('decimal' | 'lower-alpha')
 * to OrderedList so the editor supports both 1, 2, 3 and a, b, c lists in real time.
 */
const OrderedListStyleExtension = Extension.create({
  name: 'orderedListStyle',
  addGlobalAttributes() {
    return [
      {
        types: ['orderedList'],
        attributes: {
          listType: {
            default: 'decimal',
            parseHTML: element => {
              const dataType = element.getAttribute('data-list-type');
              if (dataType) return dataType;
              if (element.getAttribute('type') === 'a' || element.style.listStyleType === 'lower-alpha') {
                return 'lower-alpha';
              }
              return 'decimal';
            },
            renderHTML: attributes => {
              const type = attributes.listType || 'decimal';
              return {
                'data-list-type': type,
                type: type === 'lower-alpha' ? 'a' : '1',
                style: `list-style-type: ${type}`
              };
            }
          }
        }
      }
    ];
  }
});

interface MenuBarProps {
  editor: any;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) return null;

  const isOrderedActive = editor.isActive('orderedList');
  const currentOrderedType = editor.getAttributes('orderedList')?.listType || 'decimal';
  const isDecimalList = isOrderedActive && currentOrderedType !== 'lower-alpha';
  const isAlphaList = isOrderedActive && currentOrderedType === 'lower-alpha';

  const handleToggleDecimalList = () => {
    if (isAlphaList) {
      editor.chain().focus().updateAttributes('orderedList', { listType: 'decimal' }).run();
    } else {
      editor.chain().focus().toggleOrderedList().updateAttributes('orderedList', { listType: 'decimal' }).run();
    }
  };

  const handleToggleAlphaList = () => {
    if (isDecimalList) {
      editor.chain().focus().updateAttributes('orderedList', { listType: 'lower-alpha' }).run();
    } else if (isAlphaList) {
      editor.chain().focus().toggleOrderedList().run();
    } else {
      editor.chain().focus().toggleOrderedList().updateAttributes('orderedList', { listType: 'lower-alpha' }).run();
    }
  };

  const btnBase = 'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none';
  const btnActive = 'bg-[#ca4048] text-white shadow-sm';
  const btnInactive = 'text-slate-300 hover:text-white hover:bg-[#3e4153]';

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2.5 border-b border-[#3e4153] bg-[#1e202b] select-none">
      {/* Bold */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${btnBase} ${editor.isActive('bold') ? btnActive : btnInactive}`}
        title="Negrita"
      >
        <Bold size={14} />
        <span className="hidden sm:inline text-[11px]">Negrita</span>
      </button>

      {/* Italic */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${btnBase} ${editor.isActive('italic') ? btnActive : btnInactive}`}
        title="Cursiva"
      >
        <Italic size={14} />
        <span className="hidden sm:inline text-[11px]">Cursiva</span>
      </button>

      <div className="w-[1px] h-5 bg-[#3e4153] mx-0.5" />

      {/* Heading 1 */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${btnBase} ${editor.isActive('heading', { level: 1 }) ? btnActive : btnInactive}`}
        title="Título Principal (H1)"
      >
        <Heading1 size={14} />
        <span className="text-[11px]">Título</span>
      </button>

      {/* Heading 2 */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${btnBase} ${editor.isActive('heading', { level: 2 }) ? btnActive : btnInactive}`}
        title="Subtítulo (H2)"
      >
        <Heading2 size={14} />
        <span className="text-[11px]">Subtítulo</span>
      </button>

      <div className="w-[1px] h-5 bg-[#3e4153] mx-0.5" />

      {/* Bullet List (• Puntos) */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${btnBase} ${editor.isActive('bulletList') ? btnActive : btnInactive}`}
        title="Lista con puntos (•)"
      >
        <List size={14} />
        <span className="text-[11px] font-bold">• Puntos</span>
      </button>

      {/* Numbered List (1, 2, 3) */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={handleToggleDecimalList}
        className={`${btnBase} ${isDecimalList ? btnActive : btnInactive}`}
        title="Lista numerada (1, 2, 3)"
      >
        <ListOrdered size={14} />
        <span className="text-[11px] font-bold">1, 2, 3</span>
      </button>

      {/* Alphabetical List (a, b, c) */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={handleToggleAlphaList}
        className={`${btnBase} ${isAlphaList ? btnActive : btnInactive}`}
        title="Lista alfabética (a, b, c)"
      >
        <span className="font-mono text-[11px] font-extrabold px-1 rounded bg-white/10">a,b,c</span>
        <span className="text-[11px] font-bold">Lista a, b, c</span>
      </button>

      <div className="w-[1px] h-5 bg-[#3e4153] mx-0.5" />

      {/* Blockquote */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${btnBase} ${editor.isActive('blockquote') ? btnActive : btnInactive}`}
        title="Nota o cita destacada"
      >
        <Quote size={14} />
      </button>

      {/* Undo / Redo */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#3e4153] disabled:opacity-30 cursor-pointer"
        title="Deshacer"
      >
        <Undo size={14} />
      </button>

      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#3e4153] disabled:opacity-30 cursor-pointer"
        title="Rehacer"
      >
        <Redo size={14} />
      </button>
    </div>
  );
};

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Escribe aquí la información completa del manual. Usa los botones de arriba para crear listas (• puntos, 1,2,3 o a,b,c), títulos o negritas en tiempo real...'
}) => {
  const [, setTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2]
        }
      }),
      OrderedListStyleExtension
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onTransaction: () => {
      // Force toolbar re-render so active list/format states reflect immediately in real time
      setTick(t => t + 1);
    },
    editorProps: {
      attributes: {
        class: 'tiptap p-4 focus:outline-none min-h-[260px] max-h-[420px] overflow-y-auto text-slate-100 text-sm leading-relaxed'
      },
      handleTextInput: (view, from, _to, text) => {
        // Real-time auto-list when user types "a. " or "a) " at the start of a line
        if (text === ' ') {
          const $from = view.state.selection.$from;
          const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');
          if (/^[aA][\.\)]$/.test(textBefore) && $from.parent.type.name === 'paragraph') {
            const start = $from.start();
            view.dispatch(view.state.tr.delete(start, from));
            setTimeout(() => {
              if (editor && !editor.isActive('orderedList')) {
                editor.chain().focus().toggleOrderedList().updateAttributes('orderedList', { listType: 'lower-alpha' }).run();
              }
            }, 0);
            return true;
          }
        }
        return false;
      }
    }
  });

  // Sync external content changes (e.g. when a PDF/Word file is transcribed or an existing manual is loaded for editing)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      // Avoid resetting cursor if editor is empty and content is empty
      if (!content && editor.isEmpty) return;
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content, editor]);

  const isEmpty = !editor || editor.isEmpty;

  return (
    <div
      className="border border-[#3e4153] rounded-xl overflow-hidden bg-[#262835] focus-within:border-[#ca4048] focus-within:ring-1 focus-within:ring-[#ca4048]/40 transition-all cursor-text text-white relative"
      onClick={() => {
        if (editor && !editor.isFocused) {
          editor.chain().focus().run();
        }
      }}
    >
      <MenuBar editor={editor} />
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-4 left-4 right-4 text-xs sm:text-sm text-slate-400 pointer-events-none select-none leading-relaxed">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
