import React from 'react';
import ProposalCard from './ProposalCard';

const ProposalList = ({ proposals, type, onUpdate }) => {
  if (!proposals.length) {
    return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No {type} proposals found.</p>;
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <ProposalCard key={proposal._id} proposal={proposal} type={type} onUpdate={onUpdate} />
      ))}
    </div>
  );
};

export default ProposalList;