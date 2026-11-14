import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";

interface RichTextEditorProps {
  id: string;
  value: string;
  onChange: (html: string) => void;
  maxLength?: number;
  placeholder?: string;
  label: string;
}

const toolbarButton =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-2 text-slate-300 transition-colors hover:border-cyan-500/60 hover:bg-slate-800 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-40";

export default function RichTextEditor({
  id,
  value,
  onChange,
  maxLength = 30000,
  placeholder = "İçeriği yazın…",
  label,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const acceptedHtml = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id,
        "aria-label": label,
        "aria-placeholder": placeholder,
        class:
          "min-h-[210px] px-4 py-3 text-sm leading-6 text-slate-100 outline-none [&_a]:text-cyan-300 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-500 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_ul]:ml-5 [&_ul]:list-disc",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      if (html.length > maxLength) {
        currentEditor.commands.setContent(acceptedHtml.current, { emitUpdate: false });
        return;
      }
      acceptedHtml.current = html;
      onChangeRef.current(html);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const activeLink = currentEditor.getAttributes("link").href;
      setLinkUrl(typeof activeLink === "string" ? activeLink : "");
    },
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === (value || "")) return;
    acceptedHtml.current = value || "";
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  const applyLink = () => {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const normalized = /^(https?:|mailto:)/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalized, target: "_blank", rel: "noopener noreferrer" })
      .run();
  };

  const wordCount = editor?.getText().length ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950/70 focus-within:border-cyan-500/60">
      <div
        className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 bg-slate-900/90 p-2"
        role="toolbar"
        aria-label={`${label} biçimlendirme araçları`}
      >
        <button type="button" title="Kalın (Ctrl+B)" aria-label="Kalın" className={toolbarButton} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" title="İtalik (Ctrl+I)" aria-label="İtalik" className={toolbarButton} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" title="Üstü çizili" aria-label="Üstü çizili" className={toolbarButton} disabled={!editor} onClick={() => editor?.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </button>
        <span className="mx-1 h-6 w-px bg-slate-700" aria-hidden="true" />
        <button type="button" title="Başlık 2" aria-label="Başlık 2" className={toolbarButton} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" title="Başlık 3" aria-label="Başlık 3" className={toolbarButton} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </button>
        <button type="button" title="Madde işaretli liste" aria-label="Madde işaretli liste" className={toolbarButton} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" title="Numaralı liste" aria-label="Numaralı liste" className={toolbarButton} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <span className="mx-1 h-6 w-px bg-slate-700" aria-hidden="true" />
        <button type="button" title="Geri al (Ctrl+Z)" aria-label="Geri al" className={toolbarButton} disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" title="Yinele (Ctrl+Shift+Z)" aria-label="Yinele" className={toolbarButton} disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2 border-b border-slate-800 px-3 py-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Link2 className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            aria-label="Bağlantı adresi"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://adres.com"
            className="h-9 w-full rounded-md border border-slate-700 bg-slate-950 pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500"
          />
        </div>
        <button type="button" onClick={applyLink} disabled={!editor} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-700 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40">
          <Link2 className="h-3.5 w-3.5" />
          Bağlantıyı uygula
        </button>
        <button type="button" title="Bağlantıyı kaldır" aria-label="Bağlantıyı kaldır" onClick={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()} disabled={!editor} className="inline-flex h-9 items-center justify-center rounded-md border border-slate-700 px-3 text-slate-400 hover:bg-slate-800 disabled:opacity-40">
          <Unlink className="h-4 w-4" />
        </button>
      </div>

      <EditorContent editor={editor} />
      <div className="flex items-center justify-between px-4 pb-3 text-[11px] text-slate-500">
        <span>Biçimlendirme kısayolları desteklenir</span>
        <span>{wordCount.toLocaleString("tr-TR")} karakter</span>
      </div>
      <span className="sr-only">{maxLength} karakter sınırı</span>
    </div>
  );
}
