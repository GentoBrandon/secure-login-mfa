import * as React from "react"
import { AlertCircle, CheckCircle } from "lucide-react"

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "destructive" | "success"
  }
>(({ className = "", variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-background text-foreground border",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
    success: "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700"
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${variants[variant]} ${className}`}
      {...props}
    />
  )
})
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm [&_p]:leading-relaxed ${className}`}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

interface AlertProps {
  variant?: "default" | "destructive" | "success"
  children: React.ReactNode
  className?: string
}

const AlertMessage: React.FC<AlertProps> = ({ variant = "default", children, className = "" }) => {
  const Icon = variant === "success" ? CheckCircle : AlertCircle

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertDescription>
        {children}
      </AlertDescription>
    </Alert>
  )
}

export { Alert, AlertDescription, AlertMessage }
