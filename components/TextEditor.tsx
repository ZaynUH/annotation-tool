import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Konva from 'konva';

interface Props {
  textNode: Konva.Text;
  onChange: (newText: string) => void;
  onClose: () => void;
}

const TextEditor = ({ textNode, onChange, onClose }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    const stage = textNode.getStage();
    if (!textarea || !stage) return;

    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const scale = textNode.getAbsoluteScale();

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${stageBox.top + textPosition.y}px`;
    textarea.style.left = `${stageBox.left + textPosition.x}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.lineHeight = `${textNode.lineHeight()}`;
    textarea.style.fontFamily = textNode.fontFamily();
    const fill = textNode.fill();
    textarea.style.color = typeof fill === 'string' ? fill : '#000';
    textarea.style.background = 'transparent';
    textarea.style.border = '1px dashed #999';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.zIndex = '1000';

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
      if (e.target !== textarea && !textarea.contains(e.target as Node)) {
        commit();
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);

    const timeout = setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
    });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('click', handleClickOutside);
      textarea.removeEventListener('keydown', handleKeyDown);
    };
  }, [textNode]);

  return ReactDOM.createPortal(
    <textarea ref={textareaRef} />,
    document.body
  );
};

export default TextEditor;
