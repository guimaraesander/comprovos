import React from "react";
import styles from "./Alert.module.css";

type AlertBaseProps = React.HTMLAttributes<HTMLDivElement>;

export function AlertError({ className = "", ...props }: AlertBaseProps) {
  return <div className={`${styles.alertError} ${className}`.trim()} {...props} />;
}

type MutedProps = React.HTMLAttributes<HTMLParagraphElement>;

export function Muted({ className = "", ...props }: MutedProps) {
  return <p className={`${styles.muted} ${className}`.trim()} {...props} />;
}