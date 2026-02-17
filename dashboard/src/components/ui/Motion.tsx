'use client';

import { motion, AnimatePresence, Transition, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

// --- Configuration ---
const defaultTransition: Transition = {
    type: 'spring',
    stiffness: 100,
    damping: 15,
    mass: 0.75,
};

// --- FadeIn ---
interface FadeInProps extends HTMLMotionProps<'div'> {
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | null;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const FadeIn = ({
    children,
    delay = 0,
    direction = 'up',
    className,
    fullWidth = false,
    ...props
}: FadeInProps) => {
    const directionOffset = {
        up: { y: 20, x: 0 },
        down: { y: -20, x: 0 },
        left: { x: 20, y: 0 },
        right: { x: -20, y: 0 },
        null: { x: 0, y: 0 },
    };

    const initial = direction ? directionOffset[direction] : { x: 0, y: 0 };

    return (
        <motion.div
            initial={{ opacity: 0, ...initial }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...initial }}
            transition={{ ...defaultTransition, delay }}
            className={cn(fullWidth ? 'w-full' : '', className)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// --- StaggerContainer ---
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
    delay?: number;
    staggerDelay?: number;
    children: React.ReactNode;
}

export const StaggerContainer = ({
    children,
    delay = 0,
    staggerDelay = 0.05,
    className,
    ...props
}: StaggerContainerProps) => {
    return (
        <motion.div
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={{
                hidden: {},
                show: {
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: delay,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// --- HoverCard Effect ---
interface HoverCardProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
}

export const HoverCard = ({ className, children, ...props }: HoverCardProps) => {
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={cn("relative cursor-default", className)}
            {...props}
        >
            {/* Subtle glow effect on hover */}
            <motion.div
                className="absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
            />
            {children}
        </motion.div>
    );
};

// --- ScaleIn ---
export const ScaleIn = ({ children, delay = 0, className, ...props }: FadeInProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ ...defaultTransition, delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};
