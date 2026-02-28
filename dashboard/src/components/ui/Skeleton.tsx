import React from 'react';
import { cn } from '@/lib/utils';
import { StaggerContainer, FadeIn } from '@/components/ui/Motion';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted/10 border border-white/5", className)}
            {...props}
        />
    );
}

export function PageSkeleton() {
    return (
        <StaggerContainer className="space-y-8 w-full p-6">
            <FadeIn>
                <Skeleton className="h-10 w-1/3 mb-2 rounded-xl" />
                <Skeleton className="h-4 w-1/4 rounded-lg" />
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <Skeleton className="h-10 w-1/4 rounded-xl" />
                        <Skeleton className="h-10 w-1/6 rounded-xl" />
                    </div>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            </FadeIn>
        </StaggerContainer>
    );
}
