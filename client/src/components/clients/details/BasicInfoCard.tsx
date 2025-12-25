import React from 'react';

interface BasicInfoCardProps {
  client: any;
  improvementWarning: boolean;
}

const BasicInfoCard: React.FC<BasicInfoCardProps> = ({ client, improvementWarning }) => {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4">
      <h2>Basic Info Card</h2>
      <p>Client Name: {client?.name}</p>
      {improvementWarning && <p>Improvement Warning!</p>}
    </div>
  );
};

export default BasicInfoCard;
