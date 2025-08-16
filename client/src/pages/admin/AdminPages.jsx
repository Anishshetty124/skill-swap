import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Spinner from '../../components/common/Spinner';

// --- Dashboard Page (Responsive + Dark mode) ---
export const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    useEffect(() => { apiClient.get('/admin/stats').then(res => setStats(res.data.data)); }, []);
    if (!stats) return <Spinner text="Loading stats..." />;

    return (
        <div>
            <h1 className="text-xl sm:text-3xl font-bold mb-6 text-slate-800 dark:text-white">Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow">
                        <h3 className="text-slate-500 dark:text-slate-400 capitalize">{key.replace('total', 'Total ')}</h3>
                        <p className="text-2xl sm:text-3xl font-bold mt-2 text-slate-800 dark:text-white">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Users Page (UPDATED with more columns) ---
export const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    useEffect(() => { apiClient.get('/admin/users').then(res => setUsers(res.data.data)); }, []);

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to permanently delete this user and all their data?")) {
            try {
                await apiClient.delete(`/admin/users/${userId}`);
                setUsers(users.filter(u => u._id !== userId));
                toast.success("User deleted.");
            } catch {
                toast.error("Failed to delete user.");
            }
        }
    };

    return (
        <div>
            <h1 className="text-xl sm:text-3xl font-bold mb-6 text-slate-800 dark:text-white">User Management</h1>
            <div className="bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-lg shadow overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-slate-800 dark:text-slate-300 text-sm sm:text-base">
                    <thead>
                        <tr className="border-b dark:border-slate-700">
                            <th className="p-2 sm:p-4">Username</th>
                            <th className="p-2 sm:p-4">First Name</th>
                            <th className="p-2 sm:p-4">Last Name</th>
                            <th className="p-2 sm:p-4">Email</th>
                            <th className="p-2 sm:p-4 text-center">Swaps</th>
                            <th className="p-2 sm:p-4">Joined</th>
                            <th className="p-2 sm:p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="p-2 sm:p-4 font-semibold">{user.username}</td>
                                <td className="p-2 sm:p-4">{user.firstName}</td>
                                <td className="p-2 sm:p-4">{user.lastName}</td>
                                <td className="p-2 sm:p-4 break-words">{user.email}</td>
                                <td className="p-2 sm:p-4 text-center">{user.swapsCompleted || 0}</td>
                                <td className="p-2 sm:p-4">{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                                <td className="p-2 sm:p-4">
                                    <button onClick={() => handleDelete(user._id)} className="text-red-500 hover:underline text-sm sm:text-base">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Skills Page (Responsive) ---
export const AdminSkills = () => {
    const [skills, setSkills] = useState([]);
    useEffect(() => { apiClient.get('/admin/skills').then(res => setSkills(res.data.data)); }, []);

    return (
        <div>
            <h1 className="text-xl sm:text-3xl font-bold mb-6 text-slate-800 dark:text-white">Skill Management</h1>
            <div className="bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-lg shadow overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-slate-800 dark:text-slate-300 text-sm sm:text-base">
                    <thead>
                        <tr className="border-b dark:border-slate-700">
                            <th className="p-2 sm:p-4">Title</th>
                            <th className="p-2 sm:p-4">Category</th>
                            <th className="p-2 sm:p-4">User</th>
                            <th className="p-2 sm:p-4">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {skills.map(skill => (
                            <tr key={skill._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="p-2 sm:p-4">{skill.title}</td>
                                <td className="p-2 sm:p-4">{skill.category}</td>
                                <td className="p-2 sm:p-4">{skill.user.username}</td>
                                <td className="p-2 sm:p-4">{format(new Date(skill.createdAt), 'MMM d, yyyy')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Reports Page (Responsive) ---
export const AdminReports = () => {
    const [reports, setReports] = useState([]);
    useEffect(() => { apiClient.get('/admin/reports').then(res => setReports(res.data.data)); }, []);

    const handleUpdateStatus = async (reportId, status) => {
        try {
            await apiClient.patch(`/admin/reports/${reportId}`, { status });
            setReports(reports.filter(r => r._id !== reportId));
            toast.success(`Report marked as ${status}.`);
        } catch {
            toast.error("Failed to update report.");
        }
    };

    return (
        <div>
            <h1 className="text-xl sm:text-3xl font-bold mb-6 text-slate-800 dark:text-white">Pending Reports</h1>
            <div className="bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-lg shadow overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm sm:text-base text-slate-800 dark:text-slate-300">
                    <thead>
                        <tr className="border-b dark:border-slate-700">
                            <th className="p-2 sm:p-4">Date</th>
                            <th className="p-2 sm:p-4">Type</th>
                            <th className="p-2 sm:p-4">Reported Content</th>
                            <th className="p-2 sm:p-4">Reason</th>
                            <th className="p-2 sm:p-4">Reporter</th>
                            <th className="p-2 sm:p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map(report => (
                            <tr key={report._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="p-2 sm:p-4">{format(new Date(report.createdAt), 'MMM d, HH:mm')}</td>
                                <td className="p-2 sm:p-4 capitalize">{report.reportType}</td>
                                <td className="p-2 sm:p-4 font-semibold">{report.reportedSkill?.title || report.reportedUser?.username}</td>
                                <td className="p-2 sm:p-4">{report.reason}</td>
                                <td className="p-2 sm:p-4">{report.reporter.username}</td>
                                <td className="p-2 sm:p-4 flex flex-col sm:flex-row gap-2">
                                    <button onClick={() => handleUpdateStatus(report._id, 'resolved')} className="font-semibold text-green-600 hover:underline">Resolve</button>
                                    <button onClick={() => handleUpdateStatus(report._id, 'dismissed')} className="text-slate-500 hover:underline">Dismiss</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Notifications Page (Responsive) ---
export const AdminNotifications = () => {
    const [userId, setUserId] = useState('');
    const [message, setMessage] = useState('');
    const [url, setUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const handler = setTimeout(() => {
            apiClient.get(`/admin/users/search?query=${searchQuery}`).then(res => setSearchResults(res.data.data));
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const handleSelectUser = (user) => {
        setUserId(user._id);
        setSearchQuery(user.username);
        setSearchResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/admin/notifications/send', { userId, message, url });
            toast.success("Notification sent!");
            setUserId(''); setMessage(''); setUrl(''); setSearchQuery('');
        } catch {
            toast.error("Failed to send notification.");
        }
    };

    return (
        <div>
            <h1 className="text-xl sm:text-3xl font-bold mb-6 text-slate-800 dark:text-white">Send Custom Notification</h1>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow w-full max-w-lg flex flex-col gap-4">
                <div className="relative">
                    <label className="block mb-2 text-slate-800 dark:text-slate-300 text-sm sm:text-base">Search for User</label>
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Start typing a username..." className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm sm:text-base" />
                    {searchResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                            {searchResults.map(user => (
                                <li key={user._id} onClick={() => handleSelectUser(user)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-sm sm:text-base">
                                    {user.username} ({user.email})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div>
                    <label className="block mb-2 text-slate-800 dark:text-slate-300 text-sm sm:text-base">User ID</label>
                    <input type="text" value={userId} readOnly className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm sm:text-base" required />
                </div>
                <div>
                    <label className="block mb-2 text-slate-800 dark:text-slate-300 text-sm sm:text-base">Message</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded h-24 text-sm sm:text-base" required></textarea>
                </div>
                <div>
                    <label className="block mb-2 text-slate-800 dark:text-slate-300 text-sm sm:text-base">URL (Optional)</label>
                    <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm sm:text-base" placeholder="/dashboard" />
                </div>
                <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base">Send</button>
            </form>
        </div>
    );
};
