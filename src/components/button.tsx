import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-dark",
        primary: "bg-primary text-primary-foreground hover:bg-primary-dark",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-dark",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        outlinenobg: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-dark",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        invite:
          "border border-input bg-accent hover:bg-background hover:text-accent-foreground",
        login: "bg-pink-500 hover:bg-pink-600",
        premium: "btn btn-premium",
        purchase: "btn btn-purchase",
        accept: "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex items-center mr-2",
        deny: "bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center",
        add: "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
