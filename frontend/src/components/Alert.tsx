// frontend/src/components/Alert.tsx
import { ReactNode } from "react";
import styles from "./Alert.module.css";

type Props = {
  children: ReactNode;
  className?: string;
};

export function AlertError({ children, className = "" }: Props) {
  return (
    <div className={`${styles.error} ${className}`.trim()} role="alert">
      {children}
    </div>
  );
}

export function Muted({ children, className = "" }: Props) {
  return <div className={`${styles.muted} ${className}`.trim()}>{children}</div>;
}