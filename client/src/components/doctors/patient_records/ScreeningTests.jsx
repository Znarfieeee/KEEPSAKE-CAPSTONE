import React from 'react';

const ScreeningTests = ({ screenings }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">SCREENING TEST</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">DATE</th>
              <th className="text-left py-2 px-4">DESCRIPTION</th>
              <th className="text-left py-2 px-4">RIGHT</th>
              <th className="text-left py-2 px-4">LEFT</th>
              <th className="text-left py-2 px-4">REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {screenings.map((screening, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 px-4">{screening.date}</td>
                <td className="py-2 px-4">{screening.description}</td>
                <td className="py-2 px-4">{screening.right || '-'}</td>
                <td className="py-2 px-4">{screening.left || '-'}</td>
                <td className="py-2 px-4">{screening.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScreeningTests;
