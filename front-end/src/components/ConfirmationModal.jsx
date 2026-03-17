// src/components/ConfirmationModal.jsx
import React from "react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        {typeof message === "string" ? (
          <p className="text-gray-600 mb-6">{message}</p>
        ) : (
          <div className="text-gray-600 mb-6">{message}</div>
        )}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
