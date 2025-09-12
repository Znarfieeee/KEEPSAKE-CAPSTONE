import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const ScreeningSection = ({ form, updateForm }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="text-sm font-medium">ENS Date</Label>
                <Input
                    type="date"
                    className="border-input"
                    value={form.ens_date}
                    onChange={(e) => updateForm('ens_date', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">ENS Remarks</Label>
                <Textarea
                    className="border-input min-h-[100px]"
                    placeholder="Enter ENS remarks"
                    value={form.ens_remarks}
                    onChange={(e) => updateForm('ens_remarks', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">NHS Date</Label>
                <Input
                    type="date"
                    className="border-input"
                    value={form.nhs_date}
                    onChange={(e) => updateForm('nhs_date', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">NHS Right Ear</Label>
                <Input
                    className="border-input"
                    placeholder="Enter right ear results"
                    value={form.nhs_right_ear}
                    onChange={(e) => updateForm('nhs_right_ear', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">NHS Left Ear</Label>
                <Input
                    className="border-input"
                    placeholder="Enter left ear results"
                    value={form.nhs_left_ear}
                    onChange={(e) => updateForm('nhs_left_ear', e.target.value)}
                />
            </div>
        </div>
    )
}

export default ScreeningSection
