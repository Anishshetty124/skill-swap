import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import MySkillCard from '../components/skills/MySkillCard';
import { useAuth } from '../context/AuthContext';
import SkillCardSkeleton from '../components/skills/SkillCardSkeleton';
import CreateTeamModal from '../components/teams/CreateTeamModal';
import { toast } from 'react-toastify';

const MySkillsPage = () => {
  const [mySkills, setMySkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    if (user?._id) {
      const fetchMySkills = async () => {
        try {
          setLoading(true);
          const response = await apiClient.get(`/skills?userId=${user._id}`);
          setMySkills(response.data.data.skills);
        } catch (err) {
          setError('Failed to load your skills.');
        } finally {
          setLoading(false);
        }
      };
      fetchMySkills();
    }
  }, [user?._id]);

  const handleOpenModal = (skill) => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const handleTeamCreated = (newTeam) => {
    toast.info(`Team "${newTeam.teamName}" is now open for members!`);
  };

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Posted Skills</h1>
        <div className="grid mt-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <SkillCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );

  if (error) return <p className="text-center p-10 text-red-500">{error}</p>;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Posted Skills</h1>
        {mySkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySkills.map((skill) => (
              <MySkillCard key={skill._id} skill={skill} onCreateTeam={handleOpenModal} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">You have not posted any skills yet.</p>
        )}
      </div>

      {selectedSkill && (
        <CreateTeamModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          skill={selectedSkill}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </>
  );
};

export default MySkillsPage;
