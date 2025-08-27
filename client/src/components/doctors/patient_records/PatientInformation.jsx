import React from 'react'

const PatientInformation = ({ patient }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-b-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">PATIENT'S INFORMATION</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">LAST NAME</label>
            <p className="font-medium">{patient.lastname || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">AGE</label>
            <p className="font-medium">{`${patient.age}` || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">SEX</label>
            <p className="font-medium capitalize">{patient.sex || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">BLOOD TYPE</label>
            <p className="font-medium">{patient.bloodtype || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">BIRTH WEIGHT</label>
            <p className="font-medium">
              {patient.birth_weight ? `${patient.birth_weight} kg` : '—'}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">FIRST NAME</label>
            <p className="font-medium">{patient.firstname || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">BIRTHDATE</label>
            <p className="font-medium">{formatDate(patient.date_of_birth)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">GESTATION WEEKS</label>
            <p className="font-medium">
              {patient.gestation_weeks ? `${patient.gestation_weeks} weeks` : '—'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">BIRTH HEIGHT</label>
            <p className="font-medium">
              {patient.birth_height ? `${patient.birth_height} cm` : '—'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">STATUS</label>
            <p className="font-medium">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  patient.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {patient.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientInformation
