import { useState, useCallback, useRef, useEffect } from 'react';

export function useFormInput<T>(
  initialValue: T,
  onSave: (value: T) => void,
  saveDelay: number = 1000
) {
  const [value, setValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<T>(initialValue);
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    isTypingRef.current = true;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Clear typing timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Mark as not typing after a short delay
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
    
    // Set new timeout for saving
    timeoutRef.current = setTimeout(() => {
      if (newValue !== lastSavedRef.current) {
        onSave(newValue);
        lastSavedRef.current = newValue;
      }
    }, saveDelay);
  }, [onSave, saveDelay]);

  const handleBlur = useCallback(() => {
    isTypingRef.current = false;
    
    // Clear timeout and save immediately on blur
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value !== lastSavedRef.current) {
      onSave(value);
      lastSavedRef.current = value;
    }
  }, [value, onSave]);

  // Update value when initialValue changes, but only if not actively typing
  useEffect(() => {
    if (!isTypingRef.current && initialValue !== lastSavedRef.current) {
      setValue(initialValue);
      lastSavedRef.current = initialValue;
    }
  }, [initialValue]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    value,
    onChange: handleChange,
    onBlur: handleBlur
  };
}