import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

const styles: Record<string, string> = {
  primary: 'legacy-btn-primary',
  ghost: 'legacy-btn-ghost',
};

export const LegacyButton: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  return (
    <button className={`legacy-btn ${styles[variant]}`} {...props}>
      {children}
    </button>
  );
};
