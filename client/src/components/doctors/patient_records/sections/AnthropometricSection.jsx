import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const AnthropometricSection = ({ form, updateForm }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Weight (kg)</Label>
                <Input
                    type="number"
                    step="0.01"
                    className="border-input"
                    placeholder="Enter weight"
                    value={form.weight}
                    onChange={(e) => updateForm('weight', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Height (cm)</Label>
                <Input
                    type="number"
                    step="0.1"
                    className="border-input"
                    placeholder="Enter height"
                    value={form.height}
                    onChange={(e) => updateForm('height', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Head Circumference (cm)</Label>
                <Input
                    type="number"
                    step="0.1"
                    className="border-input"
                    placeholder="Enter head circumference"
                    value={form.head_circumference}
                    onChange={(e) => updateForm('head_circumference', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Chest Circumference (cm)</Label>
                <Input
                    type="number"
                    step="0.1"
                    className="border-input"
                    placeholder="Enter chest circumference"
                    value={form.chest_circumference}
                    onChange={(e) => updateForm('chest_circumference', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Abdominal Circumference (cm)</Label>
                <Input
                    type="number"
                    step="0.1"
                    className="border-input"
                    placeholder="Enter abdominal circumference"
                    value={form.abdominal_circumference}
                    onChange={(e) => updateForm('abdominal_circumference', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Measurement Date</Label>
                <Input
                    type="date"
                    className="border-input"
                    value={form.measurement_date}
                    onChange={(e) => updateForm('measurement_date', e.target.value)}
                />
            </div>
        </div>
    )
}

export default AnthropometricSection
