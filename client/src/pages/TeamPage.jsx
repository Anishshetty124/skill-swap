import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import Spinner from '../components/common/Spinner';
import { toast } from 'react-toastify';
import {
  PaperAirplaneIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  UserMinusIcon,
  LinkIcon,
  LockClosedIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import EditTeamModal from '../components/teams/EditTeamModal';

const formatDateSeparator = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
};

const confirmAction = async (message) => {
  return window.confirm(message);
};

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const chatEndRef = useRef(null);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/teams/${teamId}`);
      setTeam(response.data.data);
      setMeetingLink(response.data.data.meetingLink || '');
    } catch (error) {
      toast.error('Could not load team details.');
      navigate('/explore');
    } finally {
      setLoading(false);
    }
  }, [teamId, navigate]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // --- SOCKET HANDLERS ---
  useEffect(() => {
    if (!socket || !teamId) return;

    const teamRoom = `team_${teamId}`;
    socket.emit('join_team_room', teamRoom);

    const registerHandler = (event, handler) => {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    };

    const cleanups = [
      registerHandler('new_team_message', (message) =>
        setTeam((prev) => ({ ...prev, chat: [...(prev.chat || []), message] }))
      ),
      registerHandler('new_team_note', (note) =>
        setTeam((prev) => ({ ...prev, notes: [...(prev.notes || []), note] }))
      ),
      registerHandler('team_chat_cleared', () => {
        toast.info('The instructor has cleared the chat history.');
        setTeam((prev) => ({ ...prev, chat: [] }));
      }),
      registerHandler('team_message_deleted', ({ messageId }) =>
        setTeam((prev) => ({ ...prev, chat: prev.chat.filter((msg) => msg._id !== messageId) }))
      ),
      registerHandler('team_details_updated', (updatedDetails) => {
        toast.info('The team details have been updated by the instructor.');
        setTeam((prev) => ({ ...prev, ...updatedDetails }));
      }),
      registerHandler('team_closed', ({ message }) => {
        toast.success(message);
        setTeam((prev) => ({ ...prev, status: 'completed' }));
      }),
      registerHandler('team_closure_initiated', () => {
        toast.info('The instructor has requested to close the team. Please confirm completion.');
        setTeam((prev) => ({ ...prev, status: 'pending_completion' }));
      }),
      registerHandler('member_confirmed_completion', (updatedTeam) =>
        setTeam((prev) => ({ ...prev, completionConfirmedBy: updatedTeam.completionConfirmedBy }))
      ),
      registerHandler('team_closure_cancelled', () => {
        toast.warn('The instructor has cancelled the team closure request.');
        setTeam((prev) => ({ ...prev, status: 'open', completionConfirmedBy: [] }));
      }),
    ];

    return () => {
      socket.emit('leave_team_room', teamRoom);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [socket, teamId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [team?.chat]);

  // --- ACTION HANDLERS ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await apiClient.post(`/teams/${teamId}/chat`, { message: newMessage });
      setNewMessage('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message.');
    }
  };

  const handleUpdateLink = async () => {
    try {
      await apiClient.patch(`/teams/${teamId}/meeting-link`, { meetingLink });
      setTeam((prev) => ({ ...prev, meetingLink }));
      toast.success('Meeting link updated!');
    } catch (error) {
      toast.error('Failed to update link.');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await apiClient.post(`/teams/${teamId}/notes`, { content: newNote });
      setNewNote('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add note.');
    }
  };

  const handleDeleteTeam = async () => {
    if (await confirmAction('Are you sure you want to permanently delete this team? This will refund credits to all members.')) {
      try {
        await apiClient.delete(`/teams/${teamId}`);
        toast.success('Team deleted.');
        navigate('/explore');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete team.');
      }
    }
  };

  const handleClearChat = async () => {
    if (await confirmAction('Are you sure you want to clear the entire chat history? This cannot be undone.')) {
      try {
        await apiClient.delete(`/teams/${teamId}/chat`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to clear chat.');
      }
    }
  };

  const handleLeaveTeam = async () => {
    if (await confirmAction('Are you sure you want to leave this team? Your credits will be refunded.')) {
      try {
        await apiClient.post(`/teams/${teamId}/leave`);
        toast.success('You have left the team and your credits have been refunded.');
        navigate('/explore');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to leave the team.');
      }
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (await confirmAction('Are you sure you want to remove this member? Their credits will be refunded.')) {
      try {
        await apiClient.delete(`/teams/${teamId}/members/${memberId}`);
        setTeam((prev) => ({
          ...prev,
          members: prev.members.filter((m) => m._id !== memberId),
        }));
        toast.success('Member removed and credits refunded.');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to remove member.');
      }
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (await confirmAction('Are you sure you want to delete this note?')) {
      try {
        await apiClient.delete(`/teams/${teamId}/notes/${noteId}`);
        setTeam((prev) => ({ ...prev, notes: prev.notes.filter((n) => n._id !== noteId) }));
        toast.success('Note deleted.');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete note.');
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (await confirmAction('Are you sure you want to delete this message?')) {
      try {
        await apiClient.delete(`/teams/${teamId}/chat/${messageId}`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete message.');
      }
    }
  };

  const handleInitiateClosure = async () => {
    if (await confirmAction('Are you sure you want to request to close this team? Members will need to confirm completion.')) {
      try {
        await apiClient.post(`/teams/${teamId}/initiate-closure`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to initiate closure.');
      }
    }
  };

  const handleConfirmCompletion = async () => {
    setIsConfirming(true);
    try {
      await apiClient.post(`/teams/${teamId}/confirm-completion`);
      toast.success("You have confirmed the team's completion.");
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm completion.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelClosure = async () => {
    if (await confirmAction('Are you sure you want to cancel the closure request? This will reopen the team.')) {
      try {
        await apiClient.post(`/teams/${teamId}/cancel-closure`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to cancel closure.');
      }
    }
  };

  const handleDownloadNotes = async () => {
    try {
      toast.info('Preparing your PDF download...');
      const response = await apiClient.get(`/teams/${teamId}/notes/download`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `team_notes_${teamId}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match?.[1]) fileName = match[1];
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      toast.error('Could not download notes PDF.');
    }
  };

    if (loading) return <Spinner text="Loading team..." />;
    if (!team) return <p className="text-center p-10">Team not found.</p>;

    const isInstructor = team.instructor._id === user?._id;
    const isMember = team.members.some(member => member._id === user?._id);
    const isTeamCompleted = team.status === 'completed';
    const isPendingCompletion = team.status === 'pending_completion';
    const hasConfirmed = user ? team.completionConfirmedBy.includes(user._id) : false;
    const majorityCount = Math.ceil(team.members.length / 2);

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{team.teamName}</h1>
                        <p className="text-slate-500 dark:text-slate-400">A team for the skill: <span className="font-semibold">{team.skill.title}</span></p>
                        <div className="mt-4">
                            <h3 className="font-semibold">Instructor</h3>
                            <p>{team.instructor.firstName} {team.instructor.lastName} (@{team.instructor.username})</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {isTeamCompleted && <span className="px-3 py-1 text-sm font-semibold text-white bg-green-500 rounded-full">Completed</span>}
                        {isPendingCompletion && <span className="px-3 py-1 text-sm font-semibold text-white bg-yellow-500 rounded-full">Pending Completion</span>}
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                            <CurrencyDollarIcon className="h-5 w-5" />
                            <span>{team.skill.costInCredits || 0} Credits to Join</span>
                        </div>
                    </div>
                </div>
            </div>

            {(isInstructor || isMember) && team.meetingLink && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center gap-4">
                        <LinkIcon className="h-6 w-6 text-blue-500" />
                        <div>
                            <h3 className="font-semibold">Team Meeting Link</h3>
                            <a href={team.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{team.meetingLink}</a>
                        </div>
                    </div>
                </div>
            )}

            {isPendingCompletion && (isMember || isInstructor) && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-2">Confirm Team Completion</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">The instructor has requested to close this team. A majority of members must confirm that the skill has been taught.</p>
                    <p className="font-semibold mb-4">{team.completionConfirmedBy.length} of {majorityCount} required members have confirmed.</p>
                    {isMember && (
                        <button onClick={handleConfirmCompletion} disabled={hasConfirmed || isConfirming} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {hasConfirmed ? 'You have confirmed' : isConfirming ? 'Confirming...' : 'Confirm Completion'}
                        </button>
                    )}
                    {isInstructor && (
                         <button onClick={handleCancelClosure} className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                            <XCircleIcon className="h-5 w-5" /> Cancel Closure Request
                        </button>
                    )}
                </div>
            )}

            {isInstructor && !isTeamCompleted && !isPendingCompletion && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Instructor Panel</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Meeting Link</label>
                            <div className="flex gap-2">
                                <input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md" />
                                <button onClick={handleUpdateLink} className="px-4 py-2 bg-green-500 text-white rounded-md">Save</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Add a Note</label>
                            <div className="flex gap-2">
                                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Share notes links, drive links with your team..." className="w-full h-20 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md"></textarea>
                                <button onClick={handleAddNote} className="px-4 py-2 bg-blue-500 text-white rounded-md self-start">Add Note</button>
                            </div>
                        </div>
                        <div className="border-t dark:border-slate-700 pt-4 flex flex-col sm:flex-row gap-2">
                            <button onClick={() => setIsEditModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                <PencilIcon className="h-5 w-5" /> Edit Team
                            </button>
                            <button onClick={handleInitiateClosure} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                                <LockClosedIcon className="h-5 w-5" /> Request to Close Team
                            </button>
                        </div>
                        <div className="border-t dark:border-slate-700 pt-4 flex flex-col sm:flex-row gap-2">
                            <button onClick={handleClearChat} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-yellow-600 rounded-md hover:bg-yellow-700">
                                <TrashIcon className="h-5 w-5" /> Clear Chat
                            </button>
                            <button onClick={handleDeleteTeam} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                                <TrashIcon className="h-5 w-5" /> Delete Team
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                        <h3 className="font-bold mb-3">Members ({team.members.length + 1}/{team.maxMembers})</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <img src={team.instructor.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${team.instructor.firstName} ${team.instructor.lastName}`} alt={team.instructor.username} className="w-8 h-8 rounded-full" />
                                <span className="font-semibold">{team.instructor.username} (Instructor)</span>
                            </li>
                            {team.members.map(member => (
                                <li key={member._id} className="flex items-center justify-between gap-3">
                                    <Link to={`/profile/${member.username}`} className="flex items-center gap-3 hover:underline">
                                        <img src={member.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${member.firstName} ${member.lastName}`} alt={member.username} className="w-8 h-8 rounded-full" />
                                        <span>{member.username}</span>
                                        {team.completionConfirmedBy.includes(member._id) && <CheckCircleIcon className="h-5 w-5 text-green-500" title="Confirmed Completion" />}
                                    </Link>
                                    {isInstructor && !isTeamCompleted && <button onClick={() => handleRemoveMember(member._id)} className="text-red-500 hover:text-red-700"><UserMinusIcon className="h-5 w-5"/></button>}
                                </li>
                            ))}
                        </ul>
                    </div>
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
                                    <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">- {note.author?.username || '...'} on {format(new Date(note.createdAt), 'MMM d, yyyy')}</p>
                                    {isInstructor && !isTeamCompleted && (
                                        <button onClick={() => handleDeleteNote(note._id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete note">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )) : <p className="text-sm text-slate-500">No notes yet.</p>}
                        </div>
                    </div>
                    {isMember && !isInstructor && !isTeamCompleted && (
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                            <button onClick={handleLeaveTeam} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors">
                                <UserMinusIcon className="h-5 w-5" /> Leave Team
                            </button>
                        </div>
                    )}
                </div>
                <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col h-[70vh]">
                    <h3 className="p-4 font-bold border-b dark:border-slate-700">Team Chat</h3>
                    <div className="flex-grow p-4 overflow-y-auto">
                        {team.chat.map((msg, index) => {
                            const showDateSeparator = index === 0 || !isSameDay(new Date(team.chat[index - 1].createdAt), new Date(msg.createdAt));
                            const isMyMessage = msg.sender._id === user._id;
                            const canDelete = isMyMessage || isInstructor;
                            return (
                                <React.Fragment key={msg._id}>
                                    {showDateSeparator && (
                                        <div className="text-center my-4">
                                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                                                {formatDateSeparator(msg.createdAt)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex items-end gap-2 my-2 group ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                        {!isMyMessage && <img src={msg.sender.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${msg.sender.firstName} ${msg.sender.lastName}`} className="w-8 h-8 rounded-full self-start" />}
                                        {isMyMessage && canDelete && !isTeamCompleted && (
                                            <button onClick={() => handleDeleteMessage(msg._id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        <div className={`px-4 py-2 rounded-lg max-w-xs ${isMyMessage ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                            <p className="text-xs opacity-70 mt-1 text-right">{format(new Date(msg.createdAt), 'p')}</p>
                                        </div>
                                        {!isMyMessage && canDelete && !isTeamCompleted && (
                                            <button onClick={() => handleDeleteMessage(msg._id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                    {!isTeamCompleted && (
                        <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-slate-700 flex gap-2">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full" />
                            <button type="submit" className="p-2 bg-blue-500 text-white rounded-full"><PaperAirplaneIcon className="h-6 w-6" /></button>
                        </form>
                    )}
                </div>
            </div>
            {isInstructor && <EditTeamModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} team={team} onSuccess={fetchTeam}/>}
        </div>
    );
};

export default TeamPage;
