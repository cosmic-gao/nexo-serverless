import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-100 text-blue-700",
        secondary:
          "border-transparent bg-gray-100 text-gray-700",
        destructive:
          "border-transparent bg-red-100 text-red-700",
        outline:
          "border-gray-200 text-gray-700",
        success:
          "border-transparent bg-green-100 text-green-700",
        warning:
          "border-transparent bg-yellow-100 text-yellow-700",
        purple:
          "border-transparent bg-purple-100 text-purple-700",
        get:
          "border-blue-200 bg-blue-50 text-blue-600",
        post:
          "border-green-200 bg-green-50 text-green-600",
        put:
          "border-yellow-200 bg-yellow-50 text-yellow-600",
        delete:
          "border-red-200 bg-red-50 text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

