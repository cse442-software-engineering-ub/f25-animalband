import React from "react";
import "./DeleteAccountModal.css";

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-title">Delete Account</h2>
        <p className="modal-text">
          Are you sure you want to permanently delete your account? <br />
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
