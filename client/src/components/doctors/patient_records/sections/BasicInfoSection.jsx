import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { User } from 'lucide-react'

const BasicInfoSection = ({ form, updateForm }) => {
    return (
        <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
                <User className="text-primary" size={20} />
                <h3 className="text-lg font-semibold text-foreground">Patient Information</h3>
                <span className="text-sm text-destructive">(Required)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">First Name *</Label>
                    <Input
                        className="border-input"
                        placeholder="Enter first name"
                        value={form.firstname}
                        onChange={(e) => updateForm('firstname', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Last Name *</Label>
                    <Input
                        className="border-input"
                        placeholder="Enter last name"
                        value={form.lastname}
                        onChange={(e) => updateForm('lastname', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Date of Birth *</Label>
                    <Input
                        type="date"
                        className="border-input"
                        value={form.date_of_birth}
                        onChange={(e) => updateForm('date_of_birth', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Sex *</Label>
                    <Select value={form.sex} onValueChange={(v) => updateForm('sex', v)}>
                        <SelectTrigger className="border-input">
                            <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Birth Weight (kg)</Label>
                    <Input
                        type="number"
                        className="border-input"
                        placeholder="Enter birth weight"
                        value={form.birth_weight}
                        onChange={(e) => updateForm('birth_weight', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Birth Height (cm)</Label>
                    <Input
                        type="number"
                        className="border-input"
                        placeholder="Enter birth height"
                        value={form.birth_height}
                        onChange={(e) => updateForm('birth_height', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Blood Type</Label>
                    <Select
                        value={form.bloodtype}
                        onValueChange={(v) => updateForm('bloodtype', v)}
                    >
                        <SelectTrigger className="border-input">
                            <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                                <SelectItem key={bt} value={bt}>
                                    {bt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Gestation Weeks</Label>
                    <Input
                        type="number"
                        className="border-input"
                        placeholder="Enter gestation weeks"
                        value={form.gestation_weeks}
                        onChange={(e) => updateForm('gestation_weeks', e.target.value)}
                    />
                </div>
            </div>
        </div>
    )
}

export default BasicInfoSection
