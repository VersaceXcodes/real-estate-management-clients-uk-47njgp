import React from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

const GV_Footer: React.FC = () => {
  const user_settings = useAppStore((state) => state.user_settings);
  const language = user_settings?.configuration?.language || "en-UK";
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-200 text-gray-700 py-4 px-2 text-center fixed bottom-0 w-full">
      <div className="flex justify-center items-center space-x-4">
        <Link to="/terms" className="hover:underline" aria-label="Terms of Service">
          Terms of Service
        </Link>
        <span aria-hidden="true">|</span>
        <Link to="/privacy" className="hover:underline" aria-label="Privacy Policy">
          Privacy Policy
        </Link>
        <span aria-hidden="true">|</span>
        <Link to="/contact" className="hover:underline" aria-label="Contact">
          Contact
        </Link>
      </div>
      <div className="mt-2 text-sm">
        &copy; {currentYear} UK EstateHub. All rights reserved.
      </div>
      <div className="mt-1 text-xs text-gray-500">Language: {language}</div>
    </footer>
  );
};

export default GV_Footer;