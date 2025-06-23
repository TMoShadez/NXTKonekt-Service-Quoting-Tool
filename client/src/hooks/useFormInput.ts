import { useState, useCallback, useRef, useEffect } from 'react';

export function useFormInput<T>(
  initialValue: T,
  onSave: (value: T) => void,
  saveDelay: number = 1000
) {
  const [value, setValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<T>(initialValue);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for saving
    timeoutRef.current = setTimeout(() => {
      if (newValue !== lastSavedRef.current) {
        onSave(newValue);
        lastSavedRef.current = newValue;
      }
    }, saveDelay);
  }, [onSave, saveDelay]);

  const handleBlur = useCallback(() => {
    // Clear timeout and save immediately on blur
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (value !== lastSavedRef.current) {
      onSave(value);
      lastSavedRef.current = value;
    }
  }, [value, onSave]);

  // Update value when initialValue changes
  useEffect(() => {
    setValue(initialValue);
    lastSavedRef.current = initialValue;
  }, [initialValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    value,
    onChange: handleChange,
    onBlur: handleBlur
  };
}