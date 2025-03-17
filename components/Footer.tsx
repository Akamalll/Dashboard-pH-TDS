import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-semibold">IOT Monitoring System</h3>
            <p className="text-gray-400 text-sm mt-1">Memantau kualitas air dengan teknologi IoT</p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} IOT Monitoring System. All rights reserved.</p>
            <div className="mt-2 text-xs text-gray-500">
              <p>Dibuat dengan ❤️ oleh Tim Pengembang</p>
              <p className="mt-1">Versi 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
