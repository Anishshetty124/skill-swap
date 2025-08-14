import React, { useState, useEffect, useRef } from 'react';
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
    const [showAllSkills, setShowAllSkills] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    // Reputation
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userVote, setUserVote] = useState(null);

    // Chat
    const [chatStatus, setChatStatus] = useState('idle');
    const [isChatStatusLoading, setIsChatStatusLoading] = useState(true);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const longPressProps = useLongPress(() => {
        if (profile) {
            setLightboxImage(profile.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.firstName} ${profile.lastName}`);
        }
    }, 600);

    useEffect(() => {
        const fetchProfileAndChatStatus = async () => {
            try {
                setLoading(true);
                setIsAccessDenied(false);

                // Fetch profile
                const profileRes = await apiClient.get(`/users/${username}`);
                const profileData = profileRes.data.data;
                setProfile(profileData);

                // Init reputation
                setLikes(profileData.likes?.length || 0);
                setDislikes(profileData.dislikes?.length || 0);
                if (isAuthenticated && loggedInUser) {
                    if (profileData.likes?.includes(loggedInUser._id)) setUserVote('like');
                    else if (profileData.dislikes?.includes(loggedInUser._id)) setUserVote('dislike');
                }

                // Chat status if auth
                if (isAuthenticated) {
                    setIsChatStatusLoading(true);
                    try {
                        const chatRes = await apiClient.get(`/users/${profileData._id}/chat-status`);
                        setChatStatus(chatRes.data.data.status);
                    } catch (err) {
                        console.error("Failed to check chat status", err);
                    } finally {
                        setIsChatStatusLoading(false);
                    }
                } else {
                    setIsChatStatusLoading(false);
                }

               
                if (isAuthenticated && loggedInUser?.username === username) {
                    const notificationsRes = await apiClient.get('/notifications');
                    setNotifications(notificationsRes.data.data);
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

        fetchProfileAndChatStatus();
    }, [username, isAuthenticated, loggedInUser]);

    // Close notification panel on outside click
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
        try {
            const response = await apiClient.post(`/reputation/${profile._id}`, { action });
            const { likes, dislikes } = response.data.data;
            setLikes(likes);
            setDislikes(dislikes);
            if (action === 'like') setUserVote(prev => prev === 'like' ? null : 'like');
            else if (action === 'dislike') setUserVote(prev => prev === 'dislike' ? null : 'dislike');
        } catch (error) {
            console.error(`Failed to ${action} profile`, error);
        }
    };

    const handleSendChatRequest = async () => {
        try {
            await apiClient.post(`/chat-requests/${profile._id}`);
            toast.success("Chat request sent!");
            setChatStatus('pending');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send chat request.");
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
        if (isChatStatusLoading) {
            return <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>;
        }
        switch (chatStatus) {
            case 'accepted':
                return (
                    <button
                        onClick={() => navigate('/messages', { state: { newConversationWith: profile } })}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600"
                    >
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
                    <button
                        onClick={handleSendChatRequest}
                        className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600"
                    >
                        Request to Chat
                    </button>
                );
        }
    };

    const skillsWithUser = profile.skills.map(skill => ({
        ...skill,
        user: {
            _id: profile._id,
            username: profile.username,
            profilePicture: profile.profilePicture
        }
    }));
    const topCategories = [...new Set(profile.skills.map(skill => skill.category))];
    const displayedSkills = showAllSkills ? skillsWithUser : skillsWithUser.slice(0, 6);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-lg mb-8">
                <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start gap-4">
                    <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
                        <img
                            {...longPressProps}
                            className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-accent-500"
                            src={profile.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.firstName} ${profile.lastName}`}
                            alt={profile.username}
                        />
                        <div>
                            <h1 className="text-3xl font-bold">{profile.firstName} {profile.lastName}</h1>
                            <p className="text-lg text-slate-500 dark:text-slate-400">@{profile.username}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Member since {new Date(profile.createdAt).toLocaleDateString()}
                            </p>
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

                            {/* Social Links */}
                            <div className="flex items-center justify-center md:justify-start space-x-4 mt-4 text-blue-500 font-semibold">
                                {profile.socials?.github && <a href={profile.socials.github} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>}
                                {profile.socials?.linkedin && <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>}
                                {profile.socials?.website && <a href={profile.socials.website} target="_blank" rel="noopener noreferrer" className="hover:underline">Website</a>}
                            </div>

                            {/* Chat + Reputation */}
                            <div className="flex flex-col items-center sm:items-start gap-4 mt-4">
                                {!isOwner && isAuthenticated && (
                                    <div className="w-full flex justify-center sm:justify-start">
                                        {renderChatButton()}
                                    </div>
                                )}
                                {!isOwner && isAuthenticated && (
                                    <div className="flex justify-center sm:justify-start gap-4">
                                        <button onClick={() => handleReputationAction('like')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${userVote === 'like' ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                            <HandThumbUpIcon className="h-5 w-5" />
                                            <span>{likes}</span>
                                        </button>
                                        <button onClick={() => handleReputationAction('dislike')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${userVote === 'dislike' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                            <HandThumbDownIcon className="h-5 w-5" />
                                            <span>{dislikes}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Owner Buttons + Notifications */}
                    {isOwner && (
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <Link to="/my-skills" className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 dark:bg-blue-700 shadow-md rounded-md hover:bg-blue-700 dark:hover:bg-blue-800">My Skills</Link>
                            <Link to="/profile/edit" className="px-4 py-2 text-sm font-semibold text-white bg-cyan-500 dark:bg-cyan-600 hover:bg-cyan-800 rounded-md dark:hover:bg-cyan-700">Edit Profile</Link>
                            <div ref={notificationRef} className="relative flex-shrink-0">
                                <button
                                    onClick={() => setShowNotifications(prev => !prev)}
                                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    <BellIcon className="h-6 w-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <NotificationPanel
                                        notifications={notifications}
                                        onClose={() => setShowNotifications(false)}
                                        onMarkAllRead={handleMarkAllRead}
                                        onDelete={handleDeleteNotification}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats & Categories */}
                <div className="border-t dark:border-slate-700 ml-9 mt-6 pt-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <p><strong>Skills Offered:</strong> {profile.skillsOfferedCount}</p>
                            <p><strong>Swaps Completed:</strong> {profile.swapsCompleted}</p>
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
                            {topCategories.length > 0
                                ? topCategories.map(cat => (
                                    <span key={cat} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">{cat}</span>
                                ))
                                : <p className="text-sm text-slate-500 italic">No categories yet.</p>}
                        </div>
                    </div>
                </div>

                {/* Wants to Teach / Learn */}
                <div className="border-t dark:border-slate-700 ml-6 mt-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Want to Teach</h3>
                        {profile.skillsToTeach?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.skillsToTeach.map((skill, i) => (
                                    <span key={i} className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
                                ))}
                            </div>
                        ) : <p className="text-sm text-slate-500 italic">No skills listed yet.</p>}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Want to Learn</h3>
                        {profile.skillsToLearn?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.skillsToLearn.map((skill, i) => (
                                    <span key={i} className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
                                ))}
                            </div>
                        ) : <p className="text-sm text-slate-500 italic">No skills listed yet.</p>}
                    </div>
                </div>
                {/* Achievements */}
                <div className="border-t dark:border-slate-700 mt-6 pt-6">
                    <h3 className="text-lg font-semibold mb-3">Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.badges?.length > 0
                            ? profile.badges.map(badgeName => <Badge key={badgeName} name={badgeName} />)
                            : <p className="text-sm text-slate-500 italic">No achievements yet.</p>}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="flex space-x-8">
                    <button onClick={() => setActiveTab('skills')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'skills' ? 'border-accent-500 text-accent-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Skills Offered</button>
                    <button onClick={() => setActiveTab('bookmarks')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'bookmarks' ? 'border-accent-500 text-accent-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Bookmarks</button>
                </nav>
            </div>

            {/* Skills / Bookmarks */}
            <div>
                {activeTab === 'skills' && (
                    skillsWithUser.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedSkills.map(skill => <SkillCard key={skill._id} skill={skill} hideUser={true} />)}
                            </div>
                            {skillsWithUser.length > 6 && (
                                <div className="text-center mt-8">
                                    <button onClick={() => setShowAllSkills(!showAllSkills)} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-md">
                                        {showAllSkills ? 'Show Less' : `Show All ${skillsWithUser.length} Skills`}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-slate-500 italic">
                            {isOwner ? "You haven't offered any skills yet." : "This user hasn't offered any skills yet."}
                        </p>
                    )
                )}
                {activeTab === 'bookmarks' && (
                    profile.bookmarks?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {profile.bookmarks.map(skill => <SkillCard key={skill._id} skill={skill} />)}
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">
                            {isOwner ? "You haven't bookmarked any skills yet." : "This user hasn't bookmarked any skills yet."}
                        </p>
                    )
                )}
                <ImageLightbox src={lightboxImage} alt="Profile Picture" onClose={() => setLightboxImage(null)} />
            </div>
        </div>
    );
};

export default ProfilePage;
