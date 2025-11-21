import { useState, useCallback } from "react";

/**
 * Custom hook for managing modal state
 * 
 * FILE LOCATION: src/components/useCustomModal.js
 * 
 * Usage:
 * import useCustomModal from "../../components/useCustomModal";
 * const { modalState, showModal, closeModal } = useCustomModal();
 * 
 * // Show error
 * showModal("Failed to save data", "error");
 * 
 * // Show success
 * showModal("Profile updated successfully!", "success");
 * 
 * // Show warning
 * showModal("This action cannot be undone", "warning");
 * 
 * // Show info (default)
 * showModal("Your session will expire in 5 minutes");
 * 
 * // In JSX:
 * <CustomModal
 *   isOpen={modalState.isOpen}
 *   onClose={closeModal}
 *   message={modalState.message}
 *   type={modalState.type}
 *   title={modalState.title}
 * />
 */
export default function useCustomModal() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: "",
    type: "info",
    title: null,
  });

  const showModal = useCallback((message, type = "info", title = null) => {
    setModalState({
      isOpen: true,
      message,
      type,
      title,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    modalState,
    showModal,
    closeModal,
  };
}