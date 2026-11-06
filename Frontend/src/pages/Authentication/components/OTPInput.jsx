import React, { useRef, useEffect } from 'react';

/**
 * OTPInput Component
 * Renders 6 distinct digit inputs with auto-advance, backspace navigation, and paste support.
 */
export const OTPInput = ({
  value = '',
  onChange,
  length = 6,
  disabled = false,
  hasError = false,
  autoFocus = true,
  className = '',
}) => {
  const inputsRef = useRef([]);

  // Ensure digits array is always length elements long
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputsRef.current[0] && !disabled) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (e, index) => {
    const char = e.target.value.slice(-1); // grab the latest typed character

    if (char && !/^\d$/.test(char)) return; // Allow only digits

    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('');
    onChange(combined);

    // If typed a digit, advance focus to next box
    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current box is empty, move back and clear previous
        inputsRef.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className={`flex items-center justify-between gap-1.5 sm:gap-2.5 ${className}`}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className={`
            w-9 h-11 sm:w-11 sm:h-12 text-center text-base sm:text-lg font-bold rounded-xl border
            transition-all duration-150 outline-none
            ${
              hasError
                ? 'border-[#DC2626] bg-red-50/20 text-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                : digits[index]
                ? 'border-[#0F766E] bg-teal-50/20 text-[#0F766E]'
                : 'border-[#DCE3EA] bg-white text-[#1F2937]'
            }
            focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20
            ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
          `}
        />
      ))}
    </div>
  );
};

export default OTPInput;

