import React from 'react'
import { Link } from 'react-router-dom'
import { IoMdArrowBack } from 'react-icons/io'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PatientHeader = ({ patient }) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex justify-between items-center">
        <Link
          to="/pediapro/patient_records"
          className="flex items-center gap-2 text-black hover:text-primary transition duration-300 ease-in-out"
        >
          <IoMdArrowBack className="text-2xl" />
          <span className="text-lg font-bold">
            {patient.firstname} {patient.middlename} {patient.lastname}
          </span>
        </Link>
      </div>
    </div>
  )
}

export default PatientHeader
