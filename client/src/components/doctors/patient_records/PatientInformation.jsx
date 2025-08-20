import React from 'react';

const PatientInformation = ({ patient }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">PATIENT'S INFORMATION</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">LAST NAME</label>
            <p className="font-medium">{patient.lastname}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">AGE</label>
            <p className="font-medium">{patient.age}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">MOTHER'S NAME</label>
            <p className="font-medium">{patient.mother_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">CONTACT NUMBER</label>
            <p className="font-medium">{patient.contact_number}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">FIRST NAME</label>
            <p className="font-medium">{patient.firstname}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">BIRTHDATE</label>
            <p className="font-medium">{patient.birthdate}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">FATHER'S NAME</label>
            <p className="font-medium">{patient.father_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">EMAIL</label>
            <p className="font-medium">{patient.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInformation;
