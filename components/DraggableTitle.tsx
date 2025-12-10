import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FONT_STYLES } from '../types';

const DraggableTitle: React.FC = () => {
  const { textConfig } = useApp();
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Relative to center initially
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const titleRef = useRef<HTMLDivElement>(null);

  // Initialize center position
  useEffect(() => {
    setPosition({ x: window.innerWidth / 2, y: window.innerHeight * 0.15 });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const style = FONT_STYLES[textConfig.fontKey];

  return (
    <div
      ref={titleRef}
      onMouseDown={handleMouseDown}
      className="absolute z-40 cursor-move text-center select-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, 0)',
        fontFamily: style.fontFamily,
        textShadow: style.shadow
      }}
    >
      <h1
        className="transition-colors duration-200 m-0 whitespace-nowrap"
        style={{
          letterSpacing: style.spacing,
          textTransform: style.transform as any,
          color: textConfig.color,
          fontSize: `${textConfig.size * 0.48}px`,
          fontWeight: style.weight,
        }}
      >
        {textConfig.line1}
      </h1>
      <h1
        className="transition-colors duration-200 m-0 whitespace-nowrap"
        style={{
          letterSpacing: style.spacing,
          textTransform: style.transform as any,
          color: textConfig.color,
          fontSize: `${textConfig.size * 0.48}px`,
          fontWeight: style.weight,
        }}
      >
        {textConfig.line2}
      </h1>
    </div>
  );
};

export default DraggableTitle;