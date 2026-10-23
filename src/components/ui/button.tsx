import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dashboard-interactive [&_svg]:size-4';

    const variants = {
      default: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
      destructive: 'bg-destructive text-white hover:bg-destructive/90 shadow-sm',
      outline: 'border border-input bg-background hover:bg-primary/10 hover:text-primary hover:border-primary',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-primary/10 hover:text-primary',
      link: 'text-primary underline-offset-4 hover:underline'
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3 text-xs',
      lg: 'h-11 px-8 rounded-lg font-bold',
      icon: 'h-10 w-10 p-0 rounded-full'
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
