import React, { ReactNode } from "react";
import styles from "./Modal.module.css";
import { Button } from "./Button";

type ModalProps = {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  disableClose?: boolean;
};

export function Modal({
  title,
  subtitle,
  isOpen,
  onClose,
  footer,
  children,
  disableClose,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (disableClose) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{title}</h3>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={disableClose}
            aria-label="Fechar"
            className={styles.closeBtn}
          >
            ✕
          </Button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}