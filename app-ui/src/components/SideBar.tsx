import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.webp";

const Sidebar: React.FC<{}> = () => {
  return (
    <div className="flex items-center justify-center w-full h-24 bg-white shadow-lg">
      {/* Logo that links to the homepage */}
      <Link to="/" className="flex items-center space-x-4">
        <img src={logo} className="w-auto h-20" alt="App Logo" />
        <span className="text-2xl font-bold text-gray-800">
          STOCK OVERFLOW
        </span>{" "}
        {/* Application Name */}
      </Link>
    </div>
  );
};

export default Sidebar;
