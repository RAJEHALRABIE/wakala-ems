import React from 'react';

interface FinancialInfoProps {
  client: any;
  expectedCompensation: number;
  feeAmount: number;
}

const FinancialInfo: React.FC<FinancialInfoProps> = ({ client, expectedCompensation, feeAmount }) => {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4">
      <h2>Financial Info</h2>
      <p>Expected Compensation: {expectedCompensation}</p>
      <p>Fee Amount: {feeAmount}</p>
    </div>
  );
};

export default FinancialInfo;
