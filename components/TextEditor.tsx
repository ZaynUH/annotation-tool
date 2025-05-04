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

    const absPos = textNode.absolutePosition();
    
    textarea.style.position = 'absolute';
    textarea.style.top = `${absPos.y}px`;
    textarea.style.left = `${absPos.x}px`;
    textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
    textarea.style.height = `${textNode.height() - textNode.padding() * 2 + 5}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = `${textNode.lineHeight()}`; // fixed here
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    
    const fill = textNode.fill();
    textarea.style.color = typeof fill === 'string' ? fill : '#000';
    
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
