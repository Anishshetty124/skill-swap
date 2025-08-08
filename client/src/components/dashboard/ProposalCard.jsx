import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axios";
import { toast } from "react-toastify";
import ShareContactModal from "./ShareContactModal";
import { PencilIcon, ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../../context/AuthContext";

const ProposalCard = ({ proposal, type, onUpdate }) => {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();


  const handleDelete = async () => {
    const actionText =
      proposal.status === "pending" && type === "sent" ? "withdraw" : "delete";
    if (
      window.confirm(`Are you sure you want to ${actionText} this proposal?`)
    ) {
      setLoading(true);
      setError("");
      try {
        await apiClient.delete(`/proposals/${proposal._id}`);
        toast.success(`Proposal ${actionText}n successfully!`);
        navigate("/dashboard", { state: { refresh: true } });
      } catch (err) {
        setError(
          err.response?.data?.message || `Failed to ${actionText} proposal.`
        );
        setLoading(false);
      }
    }
  };

  const handleResponse = async (status, contactInfo = null) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.patch(
        `/proposals/${proposal._id}/respond`,
        { status, contactInfo }
      );
      onUpdate(response.data.data);

      if (status === "accepted") {
        if (proposal.proposalType === "credits") {
          const cost = proposal.requestedSkill?.costInCredits || 0;
          toast.success(`Proposal accepted! You earned ${cost} credits.`);
        } else {
          toast.success("Proposal accepted!");
        }
        window.location.reload();
      } else {
        toast.success("Proposal rejected.");
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} proposal.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (contactInfo) => {
    setIsEditing(false);
    handleResponse("accepted", contactInfo);
    setIsContactModalOpen(false);
  };

  const handleEditSubmit = async (contactInfo) => {
    setLoading(true);
    try {
      const response = await apiClient.patch(`/proposals/${proposal._id}/contact`, { contactInfo });
      onUpdate(response.data.data);
      toast.success("Contact info updated!");
      setIsContactModalOpen(false);
    } catch (err) {
      toast.error("Failed to update contact info.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    const otherUser = type === "received" ? proposal.proposer : proposal.receiver;
    navigate("/messages", { state: { newConversationWith: otherUser } });
  };

  const handleCompleteSwap = async () => {
    if (window.confirm("Are you sure you want to mark this swap as complete?")) {
      setLoading(true);
      try {
        const response = await apiClient.patch(`/proposals/${proposal._id}/complete`);
        onUpdate(response.data.data);
        window.location.reload();
        toast.success("Swap marked as complete!");
      } catch (err) {
        toast.error("Failed to mark swap as complete.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!proposal.proposer || !proposal.receiver) {
    window.location.reload();
    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border-l-4 border-slate-400 opacity-70 flex items-center justify-between gap-4">
        <p className="text-slate-500 italic text-sm">
          A proposal involving the skill <span className="font-semibold">"{proposal.requestedSkill?.title || 'a deleted skill'}"</span> is no longer valid as a user has left the platform.
        </p>
        <button 
          onClick={handleDelete}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0"
          title="Dismiss this proposal"
          >
          <XMarkIcon className="h-5 w-5 text-slate-500" />
        </button>
      </div>
    );
  }

  const statusColors = {
    pending: "bg-yellow-500",
    accepted: "bg-green-500",
    rejected: "bg-red-500",
    completed: "bg-cyan-500", 
  };

  const requestedSkillTitle = proposal.requestedSkill?.title || "[Deleted Skill]";
  const offeredSkillTitle = proposal.offeredSkill?.title || "[Deleted Skill]";

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border-l-4 border-accent-500">
        <div className="flex justify-between items-center mb-3">
          <span
            className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${
              statusColors[proposal.status]
            }`}
          >
            {proposal.status}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(proposal.createdAt).toLocaleDateString()}
          </span>
        </div>

        {type === "received" ? (
          <p className="text-slate-700 dark:text-slate-300">
            <span className="font-bold">{proposal.proposer.username}</span> wants your skill{" "}
            <span className="font-semibold text-accent-500">{requestedSkillTitle}</span>
            {proposal.proposalType === "skill" ? (
              <>
                {" "}
                in exchange for their skill{" "}
                <span className="font-semibold text-green-500">{offeredSkillTitle}</span>.
              </>
            ) : (
              <>
                {" "}
                for <span className="font-bold text-amber-500">{proposal.costInCredits} credits</span>.
              </>
            )}
          </p>
        ) : (
          <p className="text-slate-700 dark:text-slate-300">
            You proposed to get{" "}
            <span className="font-semibold text-accent-500">{requestedSkillTitle}</span> from{" "}
            <span className="font-bold">{proposal.receiver.username}</span>
            {proposal.proposalType === "skill" ? (
              <>
                {" "}
                in exchange for your skill{" "}
                <span className="font-semibold text-green-500">{offeredSkillTitle}</span>.
              </>
            ) : (
              <>
                {" "}
                for <span className="font-bold text-amber-500">{proposal.costInCredits} credits</span>.
              </>
            )}
          </p>
        )}

        {proposal.status === "accepted" && proposal.contactInfo && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold">Contact Details Shared:</h4>
              {type === "received" && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setIsContactModalOpen(true);
                  }}
                  className="text-slate-400 hover:text-accent-500"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              {proposal.contactInfo.phone && (
                <p>
                  <strong>Phone:</strong> {proposal.contactInfo.phone}
                </p>
              )}
              {proposal.contactInfo.email && (
                <p>
                  <strong>Email:</strong> {proposal.contactInfo.email}
                </p>
              )}
              {proposal.contactInfo.meetingLink && (
                <p>
                  <strong>Meeting Link:</strong>{" "}
                  <a
                    href={proposal.contactInfo.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Join Meeting
                  </a>
                </p>
              )}
              {proposal.contactInfo.meetingTime && (
                <p>
                  <strong>Time:</strong> {proposal.contactInfo.meetingTime}
                </p>
              )}
              {proposal.contactInfo.other && (
                <p>
                  <strong>Other:</strong> {proposal.contactInfo.other}
                </p>
              )}
              {proposal.contactInfo.note && (
                <p>
                  <strong>Note:</strong> {proposal.contactInfo.note}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end items-center space-x-3 mt-4">
          {loading ? (
            <span className="text-sm italic">Processing...</span>
          ) : (
            <>
              {proposal.status === "accepted" && (
                <>
                  <button
                    onClick={handleStartChat}
                    className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-accent-500"
                    title={`Chat with ${type === "received" ? proposal.proposer.username : proposal.receiver.username}`}
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    Chat
                  </button>

                  <button
                    onClick={handleCompleteSwap}
                    className="flex items-center gap-1 text-sm font-semibold text-green-500 hover:text-green-600"
                    title="Mark as Complete"
                  >
                    Mark as Complete
                  </button>
                </>
              )}

              {type === "received" && proposal.status === "pending" && (
                <>
                  <button
                    onClick={() => handleResponse("rejected")}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Accept
                  </button>
                </>
              )}
              <button
                onClick={handleDelete}
                className="text-slate-400 hover:text-red-500"
                title="Delete Proposal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
        {error && !loading && (
          <p className="text-red-500 text-xs mt-2 text-right">{error}</p>
        )}
      </div>

      <ShareContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={isEditing ? handleEditSubmit : handleAccept}
        existingContactInfo={isEditing ? proposal.contactInfo : null}
      />
    </>
  );
};

export default ProposalCard;
