import React from 'react';


const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    );
  }
  return <div className="flex">{stars}</div>;
};

const ReviewCard = ({ review }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-gray-800 dark:text-white">{review.reviewer.username}</span>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-gray-600 dark:text-gray-400 italic">"{review.comment}"</p>
    </div>
  );
};   

export default ReviewCard;