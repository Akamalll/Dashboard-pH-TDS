import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Copyright */}
          <p className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300">© {new Date().getFullYear()} IOT Monitoring System</p>

          {/* Credit */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <span>Dibuat</span>
            <span>oleh</span>
            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors duration-300 font-medium">
              mallls
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
