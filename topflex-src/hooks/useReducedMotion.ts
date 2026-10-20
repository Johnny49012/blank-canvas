import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** True when the OS / browser asks for reduced motion. Animated components must render a complete static state. */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => { if (live) setReduce(v); })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => { live = false; sub.remove(); };
  }, []);
  return reduce;
}
