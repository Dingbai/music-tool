import React, { useEffect, useRef, useState } from 'react';
import abcjs from 'abcjs';

interface SheetRendererProps {
  abcNotation: string;
  onNoteClick: (abcElem: any, tuneNumber: number) => void;
}

const SheetRenderer: React.FC<SheetRendererProps> = ({
  abcNotation,
  onNoteClick,
}) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!paperRef.current) return;

    // Render the ABC notation to the paper div
    abcjs.renderAbc(paperRef.current, abcNotation, {
      responsive: 'resize',
      add_classes: true,
      clickListener: (abcElem: any, tuneNumber: number) => {
        onNoteClick(abcElem, tuneNumber);
      }
    });

    setRendered(true);

    // Clean up
    return () => {
      if (paperRef.current) {
        paperRef.current.innerHTML = '';
      }
    };
  }, [abcNotation, onNoteClick]);

  // Update the rendered sheet when abcNotation changes
  useEffect(() => {
    if (rendered && paperRef.current) {
      // Re-render with the new ABC notation
      abcjs.renderAbc(paperRef.current, abcNotation, {
        responsive: 'resize',
        add_classes: true,
        clickListener: (abcElem: any, tuneNumber: number) => {
          onNoteClick(abcElem, tuneNumber);
        }
      });
    }
  }, [abcNotation, onNoteClick, rendered]);

  return (
    <div className='sheet-renderer'>
      <div className='container'>
        <div id='warnings'></div>
        <hr />
        <div id='paper' ref={paperRef}></div>
      </div>
    </div>
  );
};

export default SheetRenderer;
