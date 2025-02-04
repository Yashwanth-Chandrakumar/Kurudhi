"use client"
import React, { useState } from 'react';
import Link from 'next/link';  // Changed this import
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-red-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-white text-xl font-bold">LifeLink</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              Home
            </Link>
            <Link href="/about" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              About
            </Link>
            <Link href="/newdonor" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              Become a Donor
            </Link>
            <Link href="/needdonor" className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium">
              Require a Donor
            </Link>
            <button className="bg-white text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium">
              Login / Sign up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-red-200 focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="/" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                Home
              </Link>
              <Link href="/about" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                About
              </Link>
              <Link href="/newdonor" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                Become a Donor
              </Link>
              <Link href="/needdonor" className="text-white hover:bg-red-500 block px-3 py-2 rounded-md text-base font-medium">
                Require a Donor
              </Link>
              <button className="w-full text-center bg-white text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-base font-medium">
                Login / Sign up
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;