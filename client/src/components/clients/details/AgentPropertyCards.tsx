import React from 'react';

interface AgentPropertyCardsProps {
  client: any;
}

const AgentPropertyCards: React.FC<AgentPropertyCardsProps> = ({ client }) => {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4">
      <h2>Agent/Property Cards</h2>
      <p>Agent Name: {client?.agent?.name}</p>
      <p>Property Address: {client?.property?.address}</p>
    </div>
  );
};

export default AgentPropertyCards;
