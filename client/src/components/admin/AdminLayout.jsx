import React, { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChartBarIcon, UsersIcon, AcademicCapIcon, BellAlertIcon, FlagIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import Spinner from '../common/Spinner';

const AdminLayout = () => {
    const { user, loading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner text="Verifying permissions..." /></div>;
    }
    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    const navLinks = [
        { name: 'Dashboard', to: '/admin/dashboard', icon: ChartBarIcon },
        { name: 'Users', to: '/admin/users', icon: UsersIcon },
        { name: 'Skills', to: '/admin/skills', icon: AcademicCapIcon },
        { name: 'Reports', to: '/admin/reports', icon: FlagIcon },
        { name: 'Notifications', to: '/admin/notifications', icon: BellAlertIcon },
    ];

    const SidebarContent = () => (
        <>
            <div className="p-4 border-b dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Admin Panel</h2>
            </div>
            <nav className="p-2">
                {navLinks.map((link) => (
                    <NavLink
                        key={link.name}
                        to={link.to}
                        onClick={() => setIsMenuOpen(false)} // Close menu on link click
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 my-1 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 ${ isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold' : '' }`}
                    >
                        <link.icon className="h-5 w-5" />
                        <span>{link.name}</span>
                    </NavLink>
                ))}
            </nav>
        </>
    );

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-800 shadow-md flex-shrink-0 hidden md:block">
                <SidebarContent />
            </aside>

            {/* Mobile Menu Overlay & Sidebar */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMenuOpen(false)}></div>
            )}
            <aside className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header with Hamburger Menu */}
                <header className="md:hidden bg-white dark:bg-slate-800 shadow-sm p-4 flex items-center">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-slate-600 dark:text-slate-300">
                        {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                    </button>
                    <h1 className="text-lg font-bold ml-4 text-slate-800 dark:text-white">Admin Menu</h1>
                </header>
                
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
export default AdminLayout;
