import React from 'react';
import { Link } from 'react-router-dom';
import { IoMdArrowBack } from 'react-icons/io';
import { Button } from '@/components/ui/button';

const PatientHeader = ({ patient }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <Link
        to="/pediapro/patient_records"
        className="flex items-center gap-2 text-black hover:text-primary transition duration-300 ease-in-out"
      >
        <IoMdArrowBack className="text-2xl" />
        <span className="text-lg font-bold">
          {patient.firstname} {patient.middlename} {patient.lastname}
        </span>
      </Link>
      <Button variant="outline" className="bg-teal-600 text-white hover:bg-teal-700">
        EDIT
      </Button>
    </div>
  );
};

export default PatientHeader;
