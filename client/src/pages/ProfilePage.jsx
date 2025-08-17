import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SkillCard from '../components/skills/SkillCard';
import { MapPinIcon, HandThumbUpIcon, HandThumbDownIcon, ChatBubbleLeftRightIcon, CurrencyDollarIcon, BellIcon } from '@heroicons/react/24/solid';
import Badge from '../components/profile/Badge';
import ImageLightbox from '../components/common/ImageLightBox';
import { useLongPress } from '../hooks/useLongPress';
import ProfilePageSkeleton from '../components/profile/ProfilePageSkeleton';
import NotificationPanel from '../components/profile/NotificationPanel';
import { toast } from 'react-toastify';
import SkillCardSkeleton from '../components/skills/SkillCardSkeleton';

const AuthPrompt = () => (
    <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <h3 className="font-bold text-xl mb-2">Access Denied</h3>
        <p className="text-slate-500 mb-6">You must be logged in to view user profiles.</p>
        <div className="flex justify-center gap-4">
            <Link to="/login" className="px-6 py-2 bg-accent-600 text-white font-semibold rounded-md hover:bg-accent-700">Login</Link>
            <Link to="/register" className="px-6 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">Register</Link>
        </div>
    </div>
);

const ProfilePage = () => {
    const { username } = useParams();
    const { user: loggedInUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAccessDenied, setIsAccessDenied] = useState(false);
    const [activeTab, setActiveTab] = useState('skills');
    const [lightboxImage, setLightboxImage] = useState(null);
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userVote, setUserVote] = useState(null);
    const [chatStatus, setChatStatus] = useState('idle');
    const [isSendingChatRequest, setIsSendingChatRequest] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const [skills, setSkills] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [isTabLoading, setIsTabLoading] = useState(false);

    const longPressProps = useLongPress(() => {
        if (profile) {
            setLightboxImage(profile.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.firstName} ${profile.lastName}`);
        }
    }, 600);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                setIsAccessDenied(false);
                const profileRes = await apiClient.get(`/users/${username}`);
                const profileData = profileRes.data.data;
                setProfile(profileData);
                setLikes(profileData.likes?.length || 0);
                setDislikes(profileData.dislikes?.length || 0);
                if (isAuthenticated && loggedInUser) {
                    if (profileData.likes?.includes(loggedInUser._id)) setUserVote('like');
                    else if (profileData.dislikes?.includes(loggedInUser._id)) setUserVote('dislike');
                }
                const secondaryDataPromises = [];
                const isOwner = loggedInUser?.username === username;
                if (isAuthenticated && !isOwner) {
                    secondaryDataPromises.push(apiClient.get(`/users/${profileData._id}/chat-status`));
                }
                if (isAuthenticated && isOwner) {
                    secondaryDataPromises.push(apiClient.get('/notifications'));
                }
                const results = await Promise.all(secondaryDataPromises);
                if (isAuthenticated && !isOwner) {
                    setChatStatus(results[0].data.data.status);
                }
                if (isAuthenticated && isOwner) {
                    const notificationResultIndex = isAuthenticated && !isOwner ? 1 : 0;
                    setNotifications(results[notificationResultIndex]?.data?.data || []);
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    setIsAccessDenied(true);
                } else {
                    setError('Failed to load user profile.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, [username, isAuthenticated, loggedInUser]);

    useEffect(() => {
        const fetchTabData = async () => {
            if (!profile) return;
            setIsTabLoading(true);
            try {
                if (activeTab === 'skills') {
                    const response = await apiClient.get(`/users/${username}/skills`);
                    setSkills(response.data.data);
                } else if (activeTab === 'bookmarks') {
                    const response = await apiClient.get(`/users/${username}/bookmarks`);
                    setBookmarks(response.data.data);
                }
            } catch (tabError) {
                toast.error(`Failed to load ${activeTab}.`);
            } finally {
                setIsTabLoading(false);
            }
        };
        fetchTabData();
    }, [activeTab, profile, username]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleReputationAction = async (action) => {
        if (!isAuthenticated) {
            toast.info("Please log in to rate profiles.");
            return;
        }
        const originalLikes = likes;
        const originalDislikes = dislikes;
        const originalVote = userVote;
        if (action === 'like') {
            setUserVote(prev => (prev === 'like' ? null : 'like'));
            setLikes(prev => (userVote === 'like' ? prev - 1 : prev + 1));
            if (userVote === 'dislike') setDislikes(prev => prev - 1);
        } else if (action === 'dislike') {
            setUserVote(prev => (prev === 'dislike' ? null : 'dislike'));
            setDislikes(prev => (userVote === 'dislike' ? prev - 1 : prev + 1));
            if (userVote === 'like') setLikes(prev => prev - 1);
        }
        try {
            await apiClient.post(`/reputation/${profile._id}`, { action });
        } catch (error) {
            toast.error("Failed to update reputation.");
            setLikes(originalLikes);
            setDislikes(originalDislikes);
            setUserVote(originalVote);
        }
    };

    const handleSendChatRequest = async () => {
        setIsSendingChatRequest(true);
        try {
            await apiClient.post(`/chat-requests/${profile._id}`);
            toast.success("Chat request sent!");
            setChatStatus('pending');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send chat request.");
        } finally {
            setIsSendingChatRequest(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiClient.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success("All notifications marked as read.");
        } catch (error) {
            toast.error("Failed to mark notifications as read.");
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            await apiClient.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
        } catch (error) {
            toast.error("Failed to delete notification.");
        }
    };

    const isOwner = loggedInUser?.username === username;
    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) return <ProfilePageSkeleton />;
    if (isAccessDenied) return <AuthPrompt />;
    if (error) return <p className="text-center p-10 text-red-500">{error}</p>;
    if (!profile) return <p className="text-center p-10">User not found.</p>;

    const renderChatButton = () => {
        if (isSendingChatRequest) {
            return (
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-400 text-white font-semibold rounded-full cursor-not-allowed" disabled>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                </button>
            );
        }
        switch (chatStatus) {
            case 'accepted':
                return (
                    <button onClick={() => navigate('/messages', { state: { newConversationWith: profile } })} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600">
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        Go to Chat
                    </button>
                );
            case 'pending':
                return (
                    <button className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 font-semibold rounded-full cursor-not-allowed" disabled>
                        Request Sent
                    </button>
                );
            default:
                return (
                    <button onClick={handleSendChatRequest} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600">
                        Request to Chat
                    </button>
                );
        }
    };

    const topCategories = [...new Set(skills.map(skill => skill.category))];

    const renderTabContent = () => {
        if (isTabLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <SkillCardSkeleton key={i} />)}
                </div>
            );
        }

        if (activeTab === 'skills') {
            return skills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skills.map(skill => <SkillCard key={skill._id} skill={skill} hideUser={true} />)}
                </div>
            ) : <p className="text-slate-500 italic">{isOwner ? "You haven't offered any skills yet." : "This user hasn't offered any skills yet."}</p>;
        }

        if (activeTab === 'bookmarks') {
            return bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarks.map(skill => <SkillCard key={skill._id} skill={skill} />)}
                </div>
            ) : <p className="text-slate-500 italic">{isOwner ? "You haven't bookmarked any skills yet." : "This user hasn't bookmarked any skills yet."}</p>;
        }
        return null;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-lg mb-8">
                <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start gap-4">
                    <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
                        <img {...longPressProps} className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-accent-500" src={profile.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.firstName} ${profile.lastName}`} alt={profile.username} />
                        <div>
                            <h1 className="text-3xl font-bold">{profile.firstName} {profile.lastName}</h1>
                            <p className="text-lg text-slate-500 dark:text-slate-400">@{profile.username}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
                            {profile.locationString && (
                                <div className="flex items-center justify-center md:justify-start text-sm text-slate-500 mt-2">
                                    <MapPinIcon className="h-4 w-4 mr-1" />
                                    <span>{profile.locationString}</span>
                                </div>
                            )}
                            {profile.bio ? (
                                <p className="text-slate-600 dark:text-slate-400 mt-2">{profile.bio}</p>
                            ) : isOwner ? (
                                <p className="text-slate-500 italic mt-2">You haven't written a bio yet.</p>
                            ) : (
                                <p className="text-slate-500 italic mt-2">This user has not written a bio yet.</p>
                            )}
                            <div className="flex items-center justify-center md:justify-start space-x-4 mt-4 text-blue-500 font-semibold">
                                {profile.socials?.github && (<a href={profile.socials.github} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>)}
                                {profile.socials?.linkedin && (<a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>)}
                                {profile.socials?.website && (<a href={profile.socials.website} target="_blank" rel="noopener noreferrer" className="hover:underline">Website</a>)}
                            </div>
                            <div className="flex flex-col items-center sm:items-start gap-4 mt-4">
                                {!isOwner && isAuthenticated && (<div className="w-full flex justify-center sm:justify-start">{renderChatButton()}</div>)}
                                {!isOwner && isAuthenticated && (
                                    <div className="flex justify-center sm:justify-start gap-4">
                                        <button onClick={() => handleReputationAction("like")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${userVote === "like" ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"}`}>
                                            <HandThumbUpIcon className="h-5 w-5" />
                                            <span>{likes}</span>
                                        </button>
                                        <button onClick={() => handleReputationAction("dislike")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${userVote === "dislike" ? "bg-red-500 text-white" : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"}`}>
                                            <HandThumbDownIcon className="h-5 w-5" />
                                            <span>{dislikes}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {isOwner && (
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <Link to="/my-skills" className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 dark:bg-blue-700 shadow-md rounded-md hover:bg-blue-700 dark:hover:bg-blue-800">My Skills</Link>
                            <Link to="/profile/edit" className="px-4 py-2 text-sm font-semibold text-white bg-cyan-500 dark:bg-cyan-600 hover:bg-cyan-800 rounded-md dark:hover:bg-cyan-700">Edit Profile</Link>
                            <div ref={notificationRef} className="relative flex-shrink-0">
                                <button onClick={() => setShowNotifications((prev) => !prev)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <BellIcon className="h-6 w-6" />
                                    {unreadCount > 0 && (<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{unreadCount}</span>)}
                                </button>
                                {showNotifications && (<NotificationPanel notifications={notifications} onClose={() => setShowNotifications(false)} onMarkAllRead={handleMarkAllRead} onDelete={handleDeleteNotification} />)}
                            </div>
                        </div>
                    )}
                </div>
                <div className="border-t dark:border-slate-700 ml-9 mt-6 pt-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <p><strong>Skills Offered:</strong> {profile.skillsOfferedCount}</p>
                            <p><strong>Swaps Completed:</strong> {profile.swapsCompleted}</p>
                            {isOwner && (
                                <div className="flex items-center gap-4 pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <HandThumbUpIcon className="h-4 w-4 text-green-500" />
                                        <span className="font-semibold">{likes}</span>
                                        <span className="text-xs text-slate-500">Likes</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <HandThumbDownIcon className="h-4 w-4 text-red-500" />
                                        <span className="font-semibold">{dislikes}</span>
                                        <span className="text-xs text-slate-500">Dislikes</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <strong>Swap Credits:</strong>
                                <span className="flex items-center font-bold text-amber-500">
                                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                    {profile.swapCredits}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Top Categories</h3>
                        <div className="flex flex-wrap gap-2">
                            {topCategories.length > 0 ? topCategories.map(cat => <span key={cat} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">{cat}</span>) : <p className="text-sm text-slate-500 italic">No categories yet.</p>}
                        </div>
                    </div>
                </div>
                <div className="border-t dark:border-slate-700 ml-6 mt-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Want to Teach</h3>
                        {profile.skillsToTeach?.length > 0 ? (<div className="flex flex-wrap gap-2">{profile.skillsToTeach.map((skill, i) => <span key={i} className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>)}</div>) : <p className="text-sm text-slate-500 italic">No skills listed yet.</p>}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Want to Learn</h3>
                        {profile.skillsToLearn?.length > 0 ? (<div className="flex flex-wrap gap-2">{profile.skillsToLearn.map((skill, i) => <span key={i} className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>)}</div>) : <p className="text-sm text-slate-500 italic">No skills listed yet.</p>}
                    </div>
                </div>
                <div className="border-t dark:border-slate-700 mt-6 pt-6">
                    <h3 className="text-lg font-semibold mb-3">Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.badges?.length > 0 ? profile.badges.map(badgeName => <Badge key={badgeName} name={badgeName} />) : <p className="text-sm text-slate-500 italic">No achievements yet.</p>}
                    </div>
                </div>
            </div>
            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="flex space-x-8">
                    <button onClick={() => setActiveTab("skills")} className={`py-4 px-1 border-b-2 font-medium ${activeTab === "skills" ? "border-accent-500 text-accent-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>Skills Offered</button>
                    <button onClick={() => setActiveTab("bookmarks")} className={`py-4 px-1 border-b-2 font-medium ${activeTab === "bookmarks" ? "border-accent-500 text-accent-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>Bookmarks</button>
                </nav>
            </div>
            <div>
                {renderTabContent()}
                <ImageLightbox src={lightboxImage} alt="Profile Picture" onClose={() => setLightboxImage(null)} />
            </div>
        </div>
    );
};

export default ProfilePage;
