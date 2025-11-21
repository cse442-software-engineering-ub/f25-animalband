import { useEffect } from "react";
import "./CustomModal.css";

/**
 * CustomModal - A reusable modal component for alerts and confirmations
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal title (optional)
 * @param {string} message - Main message to display
 * @param {string} type - Modal type: 'error', 'success', 'warning', 'info' (default: 'info')
 * @param {string} confirmText - Text for confirm button (default: 'OK')
 */
export default function CustomModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "OK"
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("popup-open");
    } else {
      document.body.classList.remove("popup-open");
    }
    return () => document.body.classList.remove("popup-open");
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "error":
        return "error";
      case "success":
        return "check_circle";
      case "warning":
        return "warning";
      case "info":
      default:
        return "info";
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "error":
        return "Error";
      case "success":
        return "Success";
      case "warning":
        return "Warning";
      case "info":
      default:
        return "Notice";
    }
  };

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`custom-modal-header ${type}`}>
          <span className="material-symbols-outlined modal-icon">
            {getIcon()}
          </span>
          <h3>{getTitle()}</h3>
        </div>
        <div className="custom-modal-body">
          <p>{message}</p>
        </div>
        <div className="custom-modal-footer">
          <button className="custom-modal-btn confirm" onClick={onClose}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}