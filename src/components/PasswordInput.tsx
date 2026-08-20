import React, { useState, useRef, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  label?: string;
  requiredStar?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      containerClassName = "",
      className = "",
      value,
      onChange,
      placeholder = "••••••••",
      disabled = false,
      id,
      name,
      autoComplete = "current-password",
      label,
      requiredStar = false,
      required,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);

    // Combine refs if provided
    const setRef = (element: HTMLInputElement | null) => {
      internalRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = element;
      }
    };

    const togglePasswordVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      
      const input = internalRef.current;
      if (input) {
        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;

        setShowPassword((prev) => !prev);

        // Preserve focus and selection cursor position
        requestAnimationFrame(() => {
          input.focus();
          if (selectionStart !== null && selectionEnd !== null) {
            input.setSelectionRange(selectionStart, selectionEnd);
          }
        });
      } else {
        setShowPassword((prev) => !prev);
      }
    };

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label 
            htmlFor={id} 
            className="text-[11px] uppercase font-bold tracking-widest text-emerald-800 mb-2 block font-mono"
          >
            {label} {(requiredStar || required) && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <input
            {...props}
            ref={setRef}
            id={id}
            name={name}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            aria-label={label || props["aria-label"] || "Mot de passe"}
            className={`w-full bg-emerald-50 border border-emerald-100 pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950 transition-colors ${
              disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : ""
            } ${className}`}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={showPassword}
            title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Eye className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
