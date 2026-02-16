'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25',
    secondary: 'bg-card hover:bg-card-hover text-foreground border border-border',
    danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20',
    ghost: 'bg-transparent hover:bg-card text-muted hover:text-foreground',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}: ButtonProps) {
    return (
        <button
            className={`inline-flex items-center justify-center font-medium cursor-pointer
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
