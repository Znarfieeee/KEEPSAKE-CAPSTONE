import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const AllergySection = ({ form, updateForm }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Allergen</Label>
                <Input
                    className="border-input"
                    placeholder="Enter allergen"
                    value={form.allergen}
                    onChange={(e) => updateForm('allergen', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Reaction Type</Label>
                <Select
                    value={form.reaction_type}
                    onValueChange={(v) => updateForm('reaction_type', v)}
                >
                    <SelectTrigger className="border-input">
                        <SelectValue placeholder="Select reaction type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Severity</Label>
                <Select value={form.severity} onValueChange={(v) => updateForm('severity', v)}>
                    <SelectTrigger className="border-input">
                        <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Date Identified</Label>
                <Input
                    type="date"
                    className="border-input"
                    value={form.date_identified}
                    onChange={(e) => updateForm('date_identified', e.target.value)}
                />
            </div>
            <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                    className="border-input min-h-[100px]"
                    placeholder="Enter any additional notes about the allergy"
                    value={form.notes}
                    onChange={(e) => updateForm('notes', e.target.value)}
                />
            </div>
        </div>
    )
}

export default AllergySection
