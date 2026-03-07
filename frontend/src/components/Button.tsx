import React from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? styles.primary
      : variant === "danger"
      ? styles.danger
      : variant === "ghost"
      ? styles.ghost
      : styles.secondary;

  return (
    <button
      {...props}
      className={`${styles.btn} ${variantClass} ${className}`.trim()}
    />
  );
}