'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 border border-primary/20',
    secondary: 'bg-white/5 hover:bg-white/10 text-foreground border border-white/10 backdrop-blur-sm',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
    ghost: 'bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground',
    outline: 'bg-transparent hover:bg-white/5 text-foreground border border-white/20 hover:border-white/40',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3.5 text-base rounded-xl',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}: ButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                `inline-flex items-center justify-center font-medium cursor-pointer
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background`,
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
}
