import { useEffect, useRef, useCallback, useState } from "react";

/**
 * MERKEZI USEEFFECT PATTERN HOOKs
 *
 * Tekrarlanan useEffect pattern'lerini merkezi custom hook'lara çevirir.
 *
 * Özellikler:
 * - Cleanup management
 * - Dependency optimization
 * - Common patterns abstraction
 * - Memory leak prevention
 * - Performance optimization
 */

/**
 * useMount - component mount edildiğinde çalışır
 */
export function useMount(callback) {
  useEffect(() => {
    callback();
  }, []);
}

/**
 * useUnmount - component unmount edildiğinde çalışır
 */
export function useUnmount(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => callbackRef.current();
  }, []);
}

/**
 * useUpdateEffect - mount hariç her update'te çalışır
 */
export function useUpdateEffect(callback, dependencies) {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) {
      return callback();
    } else {
      mountedRef.current = true;
    }
  }, dependencies);
}

/**
 * useInterval - setInterval wrapper with cleanup
 */
export function useInterval(callback, delay, immediate = false) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (immediate) {
      callbackRef.current();
    }

    if (delay !== null) {
      const intervalId = setInterval(() => callbackRef.current(), delay);
      return () => clearInterval(intervalId);
    }
  }, [delay, immediate]);
}

/**
 * useTimeout - setTimeout wrapper with cleanup
 */
export function useTimeout(callback, delay) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (delay !== null) {
      const timeoutId = setTimeout(() => callbackRef.current(), delay);
      return () => clearTimeout(timeoutId);
    }
  }, [delay]);
}

/**
 * useDebounce - debounced value hook
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedEffect - debounced effect hook
 */
export function useDebouncedEffect(callback, dependencies, delay = 300) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      callbackRef.current();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [...dependencies, delay]);
}

/**
 * useThrottle - throttled value hook
 */
export function useThrottle(value, limit) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => clearTimeout(timeoutId);
  }, [value, limit]);

  return throttledValue;
}

/**
 * useEventListener - event listener with cleanup
 */
export function useEventListener(
  eventName,
  handler,
  element = null,
  options = {}
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const targetElement = element || window;

    if (!(targetElement && targetElement.addEventListener)) {
      return;
    }

    const eventListener = (event) => handlerRef.current(event);

    targetElement.addEventListener(eventName, eventListener, options);

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options.capture, options.once, options.passive]);
}

/**
 * useClickOutside - handle clicks outside element
 */
export function useClickOutside(elementRef, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (elementRef.current && !elementRef.current.contains(event.target)) {
        callbackRef.current(event);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [elementRef]);
}

/**
 * useKeyPress - handle key press events
 */
export function useKeyPress(targetKeys, callback, element = null) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const targetElement = element || window;

    const handleKeyPress = (event) => {
      const keys = Array.isArray(targetKeys) ? targetKeys : [targetKeys];

      if (
        keys.some(
          (key) =>
            event.key === key || event.code === key || event.keyCode === key
        )
      ) {
        callbackRef.current(event);
      }
    };

    targetElement.addEventListener("keydown", handleKeyPress);

    return () => {
      targetElement.removeEventListener("keydown", handleKeyPress);
    };
  }, [targetKeys, element]);
}

/**
 * useWindowSize - track window size changes
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

/**
 * useScrollPosition - track scroll position
 */
export function useScrollPosition(element = null) {
  const [scrollPosition, setScrollPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const targetElement = element || window;

    const handleScroll = () => {
      if (element) {
        setScrollPosition({
          x: element.scrollLeft,
          y: element.scrollTop,
        });
      } else {
        setScrollPosition({
          x: window.pageXOffset,
          y: window.pageYOffset,
        });
      }
    };

    targetElement.addEventListener("scroll", handleScroll);
    return () => targetElement.removeEventListener("scroll", handleScroll);
  }, [element]);

  return scrollPosition;
}

/**
 * useDocumentTitle - update document title
 */
export function useDocumentTitle(title, restoreOnUnmount = true) {
  const originalTitle = useRef(document.title);

  useEffect(() => {
    document.title = title;

    return () => {
      if (restoreOnUnmount) {
        document.title = originalTitle.current;
      }
    };
  }, [title, restoreOnUnmount]);
}

/**
 * useFavicon - update favicon
 */
export function useFavicon(faviconUrl) {
  useEffect(() => {
    const favicon =
      document.querySelector("link[rel*='icon']") ||
      document.createElement("link");

    favicon.type = "image/x-icon";
    favicon.rel = "shortcut icon";
    favicon.href = faviconUrl;

    if (!document.querySelector("link[rel*='icon']")) {
      document.getElementsByTagName("head")[0].appendChild(favicon);
    }
  }, [faviconUrl]);
}

/**
 * useOnlineStatus - track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * useVisibilityChange - track page visibility changes
 */
export function useVisibilityChange(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handleVisibilityChange = () => {
      callbackRef.current(document.visibilityState);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}

/**
 * useMediaQuery - CSS media query hook
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);

    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", handleChange);

    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * useLocalStorage - sync with localStorage
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Listen for changes to this localStorage key from other tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * useSessionStorage - sync with sessionStorage
 */
export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * useAsync - handle async operations with state
 */
export function useAsync(asyncFunction, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args) => {
    setState({ data: null, loading: true, error: null });

    try {
      const data = await asyncFunction(...args);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, dependencies);

  return { ...state, execute };
}

/**
 * usePrevious - get previous value
 */
export function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * useWhyDidYouUpdate - debug why component re-rendered
 */
export function useWhyDidYouUpdate(name, props) {
  const previous = usePrevious(props);

  useEffect(() => {
    if (previous) {
      const allKeys = Object.keys({ ...previous, ...props });
      const changedProps = {};

      allKeys.forEach((key) => {
        if (previous[key] !== props[key]) {
          changedProps[key] = {
            from: previous[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log(`[why-did-you-update] ${name}`, changedProps);
      }
    }
  });
}

/**
 * useEffectOnce - effect that runs only once, even in strict mode
 */
export function useEffectOnce(effect) {
  const destroyFunc = useRef();
  const effectCalled = useRef(false);
  const renderAfterCalled = useRef(false);

  if (effectCalled.current) {
    renderAfterCalled.current = true;
  }

  useEffect(() => {
    if (!effectCalled.current) {
      destroyFunc.current = effect();
      effectCalled.current = true;
    }

    return () => {
      if (renderAfterCalled.current === false) return;
      if (destroyFunc.current) destroyFunc.current();
    };
  }, []);
}

export default {
  useMount,
  useUnmount,
  useUpdateEffect,
  useInterval,
  useTimeout,
  useDebounce,
  useDebouncedEffect,
  useThrottle,
  useEventListener,
  useClickOutside,
  useKeyPress,
  useWindowSize,
  useScrollPosition,
  useDocumentTitle,
  useFavicon,
  useOnlineStatus,
  useVisibilityChange,
  useMediaQuery,
  useLocalStorage,
  useSessionStorage,
  useAsync,
  usePrevious,
  useWhyDidYouUpdate,
  useEffectOnce,
};
