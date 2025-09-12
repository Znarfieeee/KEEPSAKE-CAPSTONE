import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const DeliverySection = ({ form, updateForm }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Type of Delivery</Label>
                <Input
                    className="border-input"
                    placeholder="Enter delivery type"
                    value={form.type_of_delivery}
                    onChange={(e) => updateForm('type_of_delivery', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Apgar Score</Label>
                <Input
                    className="border-input"
                    placeholder="Enter Apgar score"
                    value={form.apgar_score}
                    onChange={(e) => updateForm('apgar_score', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Mother's Blood Type</Label>
                <Input
                    className="border-input"
                    placeholder="Enter mother's blood type"
                    value={form.mother_blood_type}
                    onChange={(e) => updateForm('mother_blood_type', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">Father's Blood Type</Label>
                <Input
                    className="border-input"
                    placeholder="Enter father's blood type"
                    value={form.father_blood_type}
                    onChange={(e) => updateForm('father_blood_type', e.target.value)}
                />
            </div>
            <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Distinguishable Marks</Label>
                <Textarea
                    className="border-input min-h-[100px]"
                    placeholder="Enter any distinguishing marks or features"
                    value={form.distinguishable_marks}
                    onChange={(e) => updateForm('distinguishable_marks', e.target.value)}
                />
            </div>
        </div>
    )
}

export default DeliverySection
