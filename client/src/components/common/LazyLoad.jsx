import React, { useState, useEffect, useRef } from 'react';
import Spinner from './Spinner';

const LazyLoad = ({ children, placeholderHeight = 'h-64' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const placeholderRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the placeholder is about to enter the viewport,
        // set isVisible to true to render the actual component.
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(placeholderRef.current);
        }
      },
      {
        rootMargin: '0px 0px 200px 0px', // Load 200px before it's visible
      }
    );

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }

    return () => {
      if (placeholderRef.current) {
        observer.unobserve(placeholderRef.current);
      }
    };
  }, []);

  if (isVisible) {
    return children;
  }

  // While the component is off-screen, show a simple placeholder
  return (
    <div ref={placeholderRef} className={`w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg ${placeholderHeight}`}>
      <Spinner text={null} size="sm" />
    </div>
  );
};

export default LazyLoad;
