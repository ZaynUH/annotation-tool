import { Html } from 'react-konva-utils';
import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';

interface TextEditorProps {
  textNode: Konva.Text;
  onChange: (newText: string) => void;
  onClose: () => void;
}

export default function TextEditor({ textNode, onChange, onClose }: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // ✅ Ensure we wait for mount before rendering <Html>
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !textareaRef.current || !textNode) return;

    const textarea = textareaRef.current;
    const stage = textNode.getStage();
    if (!stage) return;

    const { x, y } = textNode.absolutePosition();
    const scale = textNode.getAbsoluteScale();
    const stageBox = stage.container().getBoundingClientRect();

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${stageBox.top + y}px`;
    textarea.style.left = `${stageBox.left + x}px`;
    textarea.style.fontSize = `${textNode.fontSize() * scale.x}px`;
    textarea.style.lineHeight = `${textNode.lineHeight()}`;
    textarea.style.fontFamily = textNode.fontFamily();
    const fill = textNode.fill();
    textarea.style.color = typeof fill === 'string' ? fill : '#000';    
    textarea.style.background = 'transparent';
    textarea.style.border = '1px dashed #999';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';

    textarea.focus();

    const commit = () => {
      onChange(textarea.value);
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (e.target !== textarea) commit();
    };

    window.addEventListener('click', handleClickOutside);
    textarea.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClickOutside);
      textarea.removeEventListener('keydown', handleKeyDown);
    };
  }, [textNode, hasMounted]);

  // ✅ Delay rendering until after mount to avoid <FiberProvider /> error
  if (!hasMounted) return null;

  return (
    <Html>
      <textarea ref={textareaRef} />
    </Html>
  );
}
