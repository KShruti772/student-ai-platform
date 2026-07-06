import { forwardRef } from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
    return (
        <input
            ref={ref}
            className={twMerge(clsx('h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-cyan-400/20', className))}
            {...props}
        />
    )
})

export default Input
