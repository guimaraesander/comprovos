import { ReactNode } from "react";
import styles from "./Table.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  wrapClassName?: string;
};

export function Table({ children, className = "", wrapClassName = "" }: Props) {
  return (
    <div className={`${styles.wrap} ${wrapClassName}`.trim()}>
      <table className={`${styles.table} ${className}`.trim()}>{children}</table>
    </div>
  );
}