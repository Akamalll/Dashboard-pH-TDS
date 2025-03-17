import React from 'react';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, deviceName, isDarkMode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all duration-300 scale-100`}>
        <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
          <span className="mr-2">🗑️</span> Konfirmasi Hapus
        </h2>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
          Apakah Anda yakin ingin menghapus perangkat "{deviceName}"?
          <br />
          <span className="text-red-500 text-sm">Tindakan ini tidak dapat dibatalkan.</span>
        </p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className={`px-6 py-2 rounded-full ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-500 hover:bg-gray-600'} text-white transition-all duration-300 transform hover:scale-105`}>
            Batal
          </button>
          <button onClick={onConfirm} className="px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-300 transform hover:scale-105">
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;
