import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

// Validation schema for editing
const editUserSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  license_number: z.string().optional(),
  specialization: z.string().optional(),
  employee_id: z.string().optional(),
  notes: z.string().optional()
});

const EditUserModal = ({
  open,
  user,
  onSubmit,
  onClose,
  loading = false,
  error = null
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      department: '',
      license_number: '',
      specialization: '',
      employee_id: '',
      notes: ''
    }
  });

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        license_number: user.license_number || '',
        specialization: user.specialization || '',
        employee_id: user.employee_id || '',
        notes: user.notes || ''
      });
      setSelectedDepartment(user.department || '');
    }
  }, [user, reset]);

  const handleClose = () => {
    reset();
    setSelectedDepartment('');
    onClose();
  };

  const onFormSubmit = async (data) => {
    const result = await onSubmit(data);
    if (result?.success) {
      reset();
      setSelectedDepartment('');
    }
    return result;
  };

  const requiresLicense = ['doctor', 'nurse'].includes(user?.role);
  const userRole = user?.role || '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information for {user?.full_name || 'this user'}.
            Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        {/* Important Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Note: User role cannot be changed after account creation.
            Contact system administrator if role change is needed.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  placeholder="Enter full name"
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="user@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  {...register('employee_id')}
                  placeholder="EMP001"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Professional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={(value) => {
                    setSelectedDepartment(value);
                    setValue('department', value, { shouldDirty: true });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No department</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                    <SelectItem value="general">General Medicine</SelectItem>
                    <SelectItem value="oncology">Oncology</SelectItem>
                    <SelectItem value="neurology">Neurology</SelectItem>
                    <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {requiresLicense && (
                <div>
                  <Label htmlFor="license_number">
                    License Number {userRole === 'doctor' ? '*' : ''}
                  </Label>
                  <Input
                    id="license_number"
                    {...register('license_number')}
                    placeholder="Enter license number"
                  />
                  {errors.license_number && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.license_number.message}
                    </p>
                  )}
                </div>
              )}

              {userRole === 'doctor' && (
                <div className="md:col-span-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    {...register('specialization')}
                    placeholder="e.g., Pediatric Cardiology, Internal Medicine"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional information about this user..."
              rows={4}
            />
          </div>

          {/* Current Role Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Current Role</h4>
            <p className="text-sm text-gray-600">
              <span className="font-medium capitalize">
                {userRole?.replace('_', ' ') || 'Unknown'}
              </span>
              {userRole && (
                <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                  Cannot be changed
                </span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || isSubmitting}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={loading || isSubmitting}
              disabled={loading || isSubmitting || !isDirty}
            >
              {isDirty ? 'Save Changes' : 'No Changes'}
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;