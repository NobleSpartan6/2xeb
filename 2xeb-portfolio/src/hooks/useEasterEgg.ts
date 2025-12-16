import { useState, useEffect, useCallback, useRef } from 'react';

const TRIGGER_WORD = 'friend';
const LONG_PRESS_DURATION = 2000; // 2 seconds
const DOUBLE_CLICK_THRESHOLD = 400; // ms between clicks

interface UseEasterEggOptions {
  onActivate: () => void;
}

/**
 * Easter egg activation hook - "Hello, friend" Mr. Robot reference
 *
 * Triggers:
 * - Desktop: Type "friend" anywhere (outside inputs)
 * - Desktop: Double-click on designated element
 * - Mobile: Long press (2s) on designated element
 * - Direct: Navigate to /friend route
 */
export const useEasterEgg = ({ onActivate }: UseEasterEggOptions) => {
  const [buffer, setBuffer] = useState('');
  const [isActivated, setIsActivated] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastClickTime = useRef<number>(0);

  // Check if user is typing in an input/textarea
  const isTypingInInput = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    const tagName = activeElement.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      (activeElement as HTMLElement).isContentEditable
    );
  }, []);

  // Keyboard sequence detection - type "friend" anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (isTypingInInput()) return;
      // Don't trigger if already activated
      if (isActivated) return;

      // Only track lowercase letters
      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        const key = e.key.toLowerCase();
        setBuffer((prev) => {
          const newBuffer = (prev + key).slice(-TRIGGER_WORD.length);
          if (newBuffer === TRIGGER_WORD) {
            setIsActivated(true);
            onActivate();
            return '';
          }
          return newBuffer;
        });
      }
    };

    // Clear buffer after inactivity
    let clearTimer: NodeJS.Timeout;
    const handleKeyUp = () => {
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => setBuffer(''), 2000);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearTimeout(clearTimer);
    };
  }, [isTypingInInput, onActivate, isActivated]);

  // Long press start (mobile)
  const handlePressStart = useCallback(() => {
    if (isActivated) return;

    longPressTimer.current = setTimeout(() => {
      setIsActivated(true);
      onActivate();
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    }, LONG_PRESS_DURATION);
  }, [onActivate, isActivated]);

  // Long press end
  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Double click detection (desktop)
  const handleClick = useCallback(() => {
    if (isActivated) return;

    const now = Date.now();
    if (now - lastClickTime.current < DOUBLE_CLICK_THRESHOLD) {
      setIsActivated(true);
      onActivate();
      lastClickTime.current = 0;
    } else {
      lastClickTime.current = now;
    }
  }, [onActivate, isActivated]);

  // Reset activation state (for dismissing the easter egg)
  const reset = useCallback(() => {
    setIsActivated(false);
    setBuffer('');
  }, []);

  // Activate directly (for route-based activation)
  const activate = useCallback(() => {
    if (!isActivated) {
      setIsActivated(true);
      onActivate();
    }
  }, [onActivate, isActivated]);

  return {
    isActivated,
    reset,
    activate,
    triggerHandlers: {
      onTouchStart: handlePressStart,
      onTouchEnd: handlePressEnd,
      onTouchCancel: handlePressEnd,
      onClick: handleClick,
    },
  };
};

export default useEasterEgg;
