import { useRef } from 'react';

export const useLongPress = (callback = () => {}, ms = 300) => {
  const timeout = useRef();
  const target = useRef();

  const start = (event) => {
    if (event.type === 'mousedown') {
      if (event.detail === 2) {
        callback(event);
      }
    } else { 
      timeout.current = setTimeout(() => {
        callback(event);
      }, ms);
    }
  };

  const clear = () => {
    timeout.current && clearTimeout(timeout.current);
  };

  return {
    onMouseDown: e => start(e),
    onTouchStart: e => start(e),
    onTouchEnd: e => clear(),
    onTouchMove: e => clear(),
  };
};