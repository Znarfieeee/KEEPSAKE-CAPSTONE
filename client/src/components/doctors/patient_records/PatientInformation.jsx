import React from 'react'

const PatientInformation = ({ patient }) => {
  return (
    <div className="bg-white rounded-b-lg shadow-sm p-6 mb-6">
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4 mt-4">PATIENT'S INFORMATION</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">LAST NAME</label>
              <p className="font-medium">{patient.lastname || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">AGE</label>
              <p className="font-medium">{`${patient.age}` || '—'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">FIRST NAME</label>
              <p className="font-medium">{patient.firstname || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">BIRTHDATE</label>
              <p className="font-medium">{patient.date_of_birth}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">MIDDLE NAME</label>
              <p className="font-medium">{patient.middlename || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">SEX</label>
              <p className="font-medium capitalize">{patient.sex || '—'}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4 mt-4">CONTACT INFORMATION</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">MOTHER'S NAME</label>
              <p className="font-medium">{patient.firstname || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">BIRTHDATE</label>
              <p className="font-medium">{patient.date_of_birth}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientInformation
