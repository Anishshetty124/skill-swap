import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import Spinner from '../components/common/Spinner';
import { toast } from 'react-toastify';
import { PaperAirplaneIcon, PencilIcon, DocumentArrowDownIcon, TrashIcon, UserMinusIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

const TeamPage = () => {
    const { teamId } = useParams();
    const { user } = useAuth();
    const { socket } = useSocketContext();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [newNote, setNewNote] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [isEditingLink, setIsEditingLink] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/teams/${teamId}`);
                setTeam(response.data.data);
                setMeetingLink(response.data.data.meetingLink || '');
            } catch (error) {
                toast.error("Could not load team details.");
                navigate('/explore'); 
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, [teamId, navigate]);

    useEffect(() => {
        if (socket && teamId) {
            const teamRoom = `team_${teamId}`;
            socket.emit('join_team_room', teamRoom);

            const handleNewMessage = (message) => {
                setTeam(prevTeam => ({
                    ...prevTeam,
                    chat: [...prevTeam.chat, message]
                }));
            };
            
            const handleNewNote = (note) => {
                setTeam(prevTeam => {
                    if (!prevTeam) return null;
                    // Ensure the note has the author populated
                    if (!note.author) {
                        note.author = { username: 'Instructor' }; // Fallback
                    }
                    return {
                        ...prevTeam,
                        notes: [...prevTeam.notes, note]
                    };
                });
            };

            socket.on('new_team_message', handleNewMessage);
            socket.on('new_team_note', handleNewNote); // Listen for new notes

            return () => {
                socket.emit('leave_team_room', teamRoom);
                socket.off('new_team_message', handleNewMessage);
                socket.off('new_team_note', handleNewNote);
            };
        }
    }, [socket, teamId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [team?.chat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await apiClient.post(`/teams/${teamId}/chat`, { message: newMessage });
            setNewMessage('');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message.");
        }
    };

    const handleUpdateLink = async () => {
        try {
            await apiClient.patch(`/teams/${teamId}/meeting-link`, { meetingLink });
            setTeam(prev => ({ ...prev, meetingLink }));
            toast.success("Meeting link updated!");
            setIsEditingLink(false);
        } catch (error) {
            toast.error("Failed to update link.");
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            // The backend now populates the note and the socket event will trigger the update
            await apiClient.post(`/teams/${teamId}/notes`, { content: newNote });
            setNewNote('');
            toast.success("Note added!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add note.");
        }
    };

     const handleDeleteTeam = async () => {
        if (window.confirm("Are you sure you want to permanently delete this team? This cannot be undone.")) {
            try {
                await apiClient.delete(`/teams/${teamId}`);
                toast.success("Team deleted.");
                navigate('/explore');
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to delete team. Check server routes.");
            }
        }
    };

    const handleLeaveTeam = async () => {
        if (window.confirm("Are you sure you want to leave this team?")) {
            try {
                await apiClient.post(`/teams/${teamId}/leave`);
                toast.success("You have successfully left the team.");
                navigate('/explore');
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to leave the team.");
            }
        }
    };

     const handleRemoveMember = async (memberId) => {
        if (window.confirm("Are you sure you want to remove this member from the team?")) {
            try {
                await apiClient.delete(`/teams/${teamId}/members/${memberId}`);
                setTeam(prev => ({
                    ...prev,
                    members: prev.members.filter(member => member._id !== memberId)
                }));
                toast.success("Member removed.");
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to remove member.");
            }
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (window.confirm("Are you sure you want to delete this note?")) {
            try {
                await apiClient.delete(`/teams/${teamId}/notes/${noteId}`);
                setTeam(prev => ({
                    ...prev,
                    notes: prev.notes.filter(note => note._id !== noteId)
                }));
                toast.success("Note deleted.");
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to delete note.");
            }
        }
    };

    const handleDownloadNotes = async () => {
        try {
            toast.info("Preparing your PDF download...");
            const response = await apiClient.get(`/teams/${teamId}/notes/download`, {
                responseType: 'blob', // Important for file downloads
            });
    
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
    
            const link = document.createElement('a');
            link.href = fileURL;
            
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `team_notes_${teamId}.pdf`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2)
                    fileName = fileNameMatch[1];
            }
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
    
            link.parentNode.removeChild(link);
            URL.revokeObjectURL(fileURL);
        } catch (error) {
            toast.error("Could not download notes PDF.");
            console.error("PDF Download Error:", error);
        }
    };

    if (loading) return <Spinner text="Loading team..." />;
    if (!team) return <p className="text-center p-10">Team not found.</p>;

    const isInstructor = team.instructor._id === user?._id;
    const isMember = team.members.some(member => member._id === user?._id);

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
                <h1 className="text-3xl font-bold">{team.teamName}</h1>
                <p className="text-slate-500 dark:text-slate-400">A team for the skill: <span className="font-semibold">{team.skill.title}</span></p>
                <div className="mt-4">
                    <h3 className="font-semibold">Instructor</h3>
                    <p>{team.instructor.firstName} {team.instructor.lastName} (@{team.instructor.username})</p>
                </div>
            </div>

            {isInstructor && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Instructor Panel</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Meeting Link</label>
                            <div className="flex gap-2">
                                <input type="url" value={isEditingLink ? meetingLink : team.meetingLink || ''} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md" disabled={!isEditingLink} />
                                {isEditingLink ? (
                                    <button onClick={handleUpdateLink} className="px-4 py-2 bg-green-500 text-white rounded-md">Save</button>
                                ) : (
                                    <button onClick={() => setIsEditingLink(true)} className="p-2 bg-slate-200 dark:bg-slate-600 rounded-md"><PencilIcon className="h-5 w-5" /></button>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Add a Note</label>
                            <div className="flex gap-2">
                                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Share important info with your team..." className="w-full h-20 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md"></textarea>
                                <button onClick={handleAddNote} className="px-4 py-2 bg-blue-500 text-white rounded-md self-start">Add Note</button>
                            </div>
                        </div>
                        <div className="border-t dark:border-slate-700 pt-4">
                            <button onClick={handleDeleteTeam} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                                <TrashIcon className="h-5 w-5" /> Delete Team
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    {/* Members List */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                        <h3 className="font-bold mb-3">Members ({team.members.length + 1}/{team.maxMembers})</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <img src={team.instructor.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${team.instructor.firstName} ${team.instructor.lastName}`} alt={team.instructor.username} className="w-8 h-8 rounded-full" />
                                <span className="font-semibold">{team.instructor.username} (Instructor)</span>
                            </li>
                            {team.members.map(member => (
                                <li key={member._id} className="flex items-center gap-3">
                                    <img src={member.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${member.firstName} ${member.lastName}`} alt={member.username} className="w-8 h-8 rounded-full" />
                                    <span>{member.username}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Team Notes Section */}
                     <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold">Team Notes</h3>
                            <button onClick={handleDownloadNotes} className="p-2 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500" title="Download Notes as PDF">
                                <DocumentArrowDownIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {team.notes && team.notes.length > 0 ? [...team.notes].reverse().map(note => (
                                <div key={note._id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md group relative">
                                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                        - {note.author?.username || '...'} on {format(new Date(note.createdAt), 'MMM d, yyyy')}
                                    </p>
                                    {isInstructor && (
                                        <button onClick={() => handleDeleteNote(note._id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete note">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )) : <p className="text-sm text-slate-500">No notes yet.</p>}
                        </div>
                    </div>

                    {isMember && !isInstructor && (
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                            <button onClick={handleLeaveTeam} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors">
                                <UserMinusIcon className="h-5 w-5" /> Leave Team
                            </button>
                        </div>
                    )}
                </div>

                {/* Team Chat */}
                <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col h-[70vh]">
                    <h3 className="p-4 font-bold border-b dark:border-slate-700">Team Chat</h3>
                    <div className="flex-grow p-4 overflow-y-auto">
                        {team.chat.map(msg => (
                            <div key={msg._id} className={`flex gap-3 my-3 ${msg.sender._id === user._id ? 'justify-end' : ''}`}>
                                {msg.sender._id !== user._id && <img src={msg.sender.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${msg.sender.firstName} ${msg.sender.lastName}`} className="w-8 h-8 rounded-full" />}
                                <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.sender._id === user._id ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                    <p className="text-xs opacity-70 mt-1 text-right">{format(new Date(msg.createdAt), 'p')}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-slate-700 flex gap-2">
                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full" />
                        <button type="submit" className="p-2 bg-blue-500 text-white rounded-full"><PaperAirplaneIcon className="h-6 w-6" /></button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TeamPage;
