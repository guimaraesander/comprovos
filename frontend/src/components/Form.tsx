import { ReactNode } from "react";
import styles from "./Form.module.css";

type FormGridProps = {
  children: ReactNode;
  className?: string;
};

export function FormGrid({ children, className = "" }: FormGridProps) {
  return <div className={`${styles.grid} ${className}`.trim()}>{children}</div>;
}

type FieldProps = {
  label: string;
  children: ReactNode;
  full?: boolean;
  className?: string;
};

export function Field({ label, children, full, className = "" }: FieldProps) {
  return (
    <label
      className={`${styles.field} ${full ? styles.full : ""} ${className}`.trim()}
    >
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}