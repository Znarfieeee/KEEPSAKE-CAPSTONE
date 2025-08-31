import React, { useState } from 'react'
import { format } from 'date-fns'

// UI Components
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle } from 'lucide-react'

const AddPatientPrescriptionModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    findings: '',
    consultation_type: '',
    consultation_notes: '',
    doctor_instructions: '',
    return_date: undefined,
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white hover:bg-primary/90">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Prescription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add new prescription</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Consultation Type */}
          <div className="space-y-2">
            <Label htmlFor="consultation_type">Consultation Type</Label>
            <Select
              value={formData.consultation_type}
              onValueChange={(value) => handleChange('role', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select consultation type"></SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Routine Checkup">Routine Checkup</SelectItem>
                <SelectItem value="Acute Illness">Acute Illness</SelectItem>
                <SelectItem value="Chronic Condition">Chronic Condition</SelectItem>
                <SelectItem value="Vaccination">Vaccination</SelectItem>
                <SelectItem value="Follow-up / Post Treatment">
                  Follow-up / Post Treatment
                </SelectItem>
                <SelectItem value="Emergency / Urgent">Emergency / Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Findings */}
          <div className="space-y-2">
            <Label htmlFor="findings">Findings</Label>
            <Input
              id="findings"
              type="text"
              placeholder=""
              value={formData.findings}
              onChange={(e) => handleChange('findings', e.target.value)}
              required
            />
          </div>
          {/* Consultation notes */}
          <div className="space-y-2">
            <Label htmlFor="consultation_notes">Consultation Notes</Label>
            <Input
              id="consultation_notes"
              type="text"
              placeholder=""
              value={formData.consultation_notes}
              onChange={(e) => handleChange('consultation_notes', e.target.value)}
            />
          </div>
          {/* Medications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Medications</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    medications: [
                      ...prev.medications,
                      { name: '', dosage: '', frequency: '', duration: '' },
                    ],
                  }))
                }}
              >
                Add Medication
              </Button>
            </div>
            {formData.medications.map((med, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="grid grid-cols-4 gap-2 flex-1">
                  <Input
                    placeholder="Medicine name"
                    value={med.name}
                    onChange={(e) => {
                      const newMeds = [...formData.medications]
                      newMeds[index].name = e.target.value
                      handleChange('medications', newMeds)
                    }}
                  />
                  <Input
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) => {
                      const newMeds = [...formData.medications]
                      newMeds[index].dosage = e.target.value
                      handleChange('medications', newMeds)
                    }}
                  />
                  <Input
                    placeholder="Frequency"
                    value={med.frequency}
                    onChange={(e) => {
                      const newMeds = [...formData.medications]
                      newMeds[index].frequency = e.target.value
                      handleChange('medications', newMeds)
                    }}
                  />
                  <Input
                    placeholder="Duration"
                    value={med.duration}
                    onChange={(e) => {
                      const newMeds = [...formData.medications]
                      newMeds[index].duration = e.target.value
                      handleChange('medications', newMeds)
                    }}
                  />
                </div>
                {formData.medications.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      const newMeds = formData.medications.filter((_, i) => i !== index)
                      handleChange('medications', newMeds)
                    }}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Doctor's Instruction */}
          <div className="space-y-2">
            <Label htmlFor="doctor_instructions">Instructions</Label>
            <Input
              id="doctor_instructions"
              type="text"
              placeholder=""
              value={formData.doctor_instructions}
              onChange={(e) => handleChange('doctor_instructions', e.target.value)}
            />
          </div>

          {/* Return Date */}
          <div className="space-y-2">
            <Label htmlFor="return_date">Return Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {formData.return_date ? (
                    format(formData.return_date, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.return_date}
                  onSelect={(date) => handleChange('return_date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddPatientPrescriptionModal
