import React from 'react';
import SkillCard from './SkillCard';
import { UserGroupIcon } from '@heroicons/react/24/solid';

const MySkillCard = ({ skill, onCreateTeam }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col h-full">
      <div className="flex-grow">
        <SkillCard skill={skill} />
      </div>
      {/* Add the "Create Team" button only for skills you offer */}
      {skill.type === 'OFFER' && (
        <div className="p-4 border-t dark:border-slate-700">
          <button
            onClick={() => onCreateTeam(skill)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            <UserGroupIcon className="h-5 w-5" />
            Create a Team
          </button>
        </div>
      )}
    </div>
  );
};

export default MySkillCard;
