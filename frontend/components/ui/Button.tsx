import { forwardRef } from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { className, variant = 'secondary', size = 'md', ...props },
    ref
) {
    const base = 'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-45'
    const styles = {
        primary: 'bg-primary text-primary-foreground shadow-xl shadow-black/10 hover:opacity-90',
        secondary: 'border border-border bg-card text-foreground shadow-xl shadow-black/5 hover:border-[var(--border-strong)] hover:bg-secondary',
        ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    }
    const sizes = {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'min-h-[52px] px-6 py-3 text-base',
    }
    return <button ref={ref} className={twMerge(clsx(base, styles[variant], sizes[size], className))} {...props} />
})

export default Button
