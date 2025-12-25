import React from 'react';

interface FinancialSummaryProps {
  financials: any;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ financials }) => {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4">
      <h2>Financial Summary</h2>
      <p>Total Income: {financials?.totalIncome}</p>
      <p>Total Expenses: {financials?.totalExpenses}</p>
    </div>
  );
};

export default FinancialSummary;
