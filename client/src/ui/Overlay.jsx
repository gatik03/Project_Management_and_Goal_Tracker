import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { IconButton } from "./index";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className="dialog-overlay"
          style={{ display: "block" }}
        />
        <RadixDialog.Content
          className="dialog-content"
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            zIndex: 71,
          }}
        >
          <RadixDialog.Title asChild>
            <h2>{title}</h2>
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className="muted">
              {description}
            </RadixDialog.Description>
          )}
          {children}
          {actions && <div className="dialog-actions">{actions}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
export function Sheet({ open, onOpenChange, title, children, footer }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className="dialog-overlay"
          style={{ display: "block" }}
        />
        <RadixDialog.Content
          className="dialog-content sheet-content"
          style={{ position: "fixed", right: 0, top: 0, zIndex: 71 }}
        >
          <RadixDialog.Description className="sr-only">
            Edit the fields, then save or close this sheet.
          </RadixDialog.Description>
          <div className="page-header">
            <RadixDialog.Title asChild>
              <h2>{title}</h2>
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton label="Close sheet">
                <X size={18} aria-hidden="true" />
              </IconButton>
            </RadixDialog.Close>
          </div>
          {children}
          {footer && <div className="dialog-actions">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
