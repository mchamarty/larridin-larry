'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import clsx from 'clsx';

type MotionDivWithClassNameProps = React.HTMLAttributes<HTMLDivElement> & React.ComponentProps<typeof motion.div>;

const MotionDiv = React.forwardRef<HTMLDivElement, MotionDivWithClassNameProps>(
  ({ className, ...props }, ref) => (
    <motion.div ref={ref} {...(props as any)} className={clsx(className)} />
  )
);
MotionDiv.displayName = 'MotionDiv';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<HTMLDivElement, MotionDivWithClassNameProps>(
({ children, className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
    />
    <DialogPrimitive.Content asChild aria-describedby="dialog-description">
      <MotionDiv
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg shadow-lg p-6',
          className
        )}
        {...(props as any)}
      >
        <div id="dialog-description" className="sr-only">
          Dialog content for accessibility
        </div>
        {children}
      </MotionDiv>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 text-xl font-semibold text-gray-900">{children}</div>
);

export const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close> & { className?: string }
>(({ children, className, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    {...props}
    className={clsx(
      'absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors',
      className
    )}
  >
    {children || '×'}
  </DialogPrimitive.Close>
));
DialogClose.displayName = 'DialogClose';

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

