const Footer = () => {
  return (
    <footer className="w-full py-4 text-center bg-gray-100 mt-auto">
      <div className="container mx-auto">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} Nama Website. Dibuat dengan ❤️ oleh{' '}
          <a href="https://github.com/username" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
            Nama Anda
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
