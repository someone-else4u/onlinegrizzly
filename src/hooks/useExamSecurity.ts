import { useEffect, useCallback, useState } from "react";
import { SecurityFlag } from "@/types/exam";

interface UseExamSecurityOptions {
  onSecurityViolation?: (flag: SecurityFlag) => void;
  onFullscreenExit?: () => void;
}

export function useExamSecurity(options: UseExamSecurityOptions = {}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [securityFlags, setSecurityFlags] = useState<SecurityFlag[]>([]);

  const addSecurityFlag = useCallback((type: SecurityFlag['type'], details?: string) => {
    const flag: SecurityFlag = {
      type,
      timestamp: new Date(),
      details
    };
    setSecurityFlags(prev => [...prev, flag]);
    options.onSecurityViolation?.(flag);
  }, [options]);

  // Prevent context menu (right-click)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addSecurityFlag('copy-attempt', 'Right-click context menu blocked');
      return false;
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [addSecurityFlag]);

  // Prevent keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X
      if (e.ctrlKey && ['c', 'v', 'a', 'x', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        addSecurityFlag('copy-attempt', `Blocked: Ctrl+${e.key.toUpperCase()}`);
        return false;
      }
      
      // Block F12, Ctrl+Shift+I (DevTools)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        addSecurityFlag('devtools', 'Developer tools shortcut blocked');
        return false;
      }

      // Block Ctrl+T (new tab)
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        addSecurityFlag('tab-switch', 'New tab shortcut blocked');
        return false;
      }

      // Block Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        addSecurityFlag('screenshot', 'Screenshot attempt blocked');
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addSecurityFlag]);

  // Detect tab/window visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        addSecurityFlag('tab-switch', 'User switched to another tab/window');
      }
    };

    const handleBlur = () => {
      setTabSwitchCount(prev => prev + 1);
      addSecurityFlag('tab-switch', 'Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [addSecurityFlag]);

  // Handle fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      if (!isNowFullscreen && isFullscreen) {
        addSecurityFlag('fullscreen-exit', 'User exited fullscreen mode');
        options.onFullscreenExit?.();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen, addSecurityFlag, options]);

  // Prevent text selection
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .secure-content, .secure-content * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Detect copy attempts
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addSecurityFlag('copy-attempt', 'Copy event blocked');
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addSecurityFlag('copy-attempt', 'Paste event blocked');
      return false;
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      addSecurityFlag('copy-attempt', 'Cut event blocked');
      return false;
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [addSecurityFlag]);

  return {
    isFullscreen,
    tabSwitchCount,
    securityFlags,
    enterFullscreen,
    exitFullscreen,
    addSecurityFlag
  };
}
