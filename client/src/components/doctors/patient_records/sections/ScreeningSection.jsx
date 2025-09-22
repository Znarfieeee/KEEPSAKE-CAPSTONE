import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Activity, AlertTriangle, Heart } from 'lucide-react'

const ScreeningSection = ({ form, updateForm }) => {
    const [dateStates, setDateStates] = useState({
        ens_date: form.ens_date ? new Date(form.ens_date) : null,
        nhs_date: form.nhs_date ? new Date(form.nhs_date) : null,
        pos_date: form.pos_date ? new Date(form.pos_date) : null,
        ror_date: form.ror_date ? new Date(form.ror_date) : null,
    })

    const { ens_date, nhs_date, pos_date, ror_date } = dateStates

    const set_ens_date = (date) => {
        setDateStates((prev) => ({ ...prev, ens_date: date }))
    }

    const set_nhs_date = (date) => {
        setDateStates((prev) => ({ ...prev, nhs_date: date }))
    }

    const set_pos_date = (date) => {
        setDateStates((prev) => ({ ...prev, pos_date: date }))
    }

    const set_ror_date = (date) => {
        setDateStates((prev) => ({ ...prev, ror_date: date }))
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center space-x-3 border-b pb-4">
                <Activity className="h-6 w-6 text-primary" />
                <div>
                    <h2 className="text-xl font-semibold">Newborn Screening Tests</h2>
                    <p className="text-sm text-muted-foreground">
                        Record screening results and observations
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ENS (Early Newborn Screening) */}
                <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="h-8 w-1 bg-blue-500 rounded-full" />
                        <div>
                            <h3 className="text-lg font-semibold">Early Newborn Screening</h3>
                            <p className="text-sm text-muted-foreground">ENS Results</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Screening Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={'outline'}
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !ens_date && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {ens_date ? (
                                            format(ens_date, 'PPP')
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={ens_date}
                                        onSelect={(date) => {
                                            set_ens_date(date)
                                            updateForm(
                                                'ens_date',
                                                date ? date.toISOString().split('T')[0] : ''
                                            )
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <Label
                                htmlFor="ens_remarks"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Normal Results
                            </Label>
                            <Switch
                                id="ens_remarks"
                                checked={form.ens_remarks}
                                onCheckedChange={(checked) => updateForm('ens_remarks', checked)}
                            />
                        </div>
                    </div>
                </div>

                {/* NHS (Newborn Hearing Screening) */}
                <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="h-8 w-1 bg-green-500 rounded-full" />
                        <div>
                            <h3 className="text-lg font-semibold">Hearing Screening</h3>
                            <p className="text-sm text-muted-foreground">NHS Results</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Screening Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={'outline'}
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !nhs_date && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {nhs_date ? (
                                            format(nhs_date, 'PPP')
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={nhs_date}
                                        onSelect={(date) => {
                                            set_nhs_date(date)
                                            updateForm(
                                                'nhs_date',
                                                date ? date.toISOString().split('T')[0] : ''
                                            )
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-2 p-3 bg-muted rounded-lg">
                                <Label
                                    htmlFor="nhs_right_ear"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Right Ear Pass
                                </Label>
                                <Switch
                                    id="nhs_right_ear"
                                    checked={form.nhs_right_ear}
                                    onCheckedChange={(checked) =>
                                        updateForm('nhs_right_ear', checked)
                                    }
                                />
                            </div>
                            <div className="flex flex-col space-y-2 p-3 bg-muted rounded-lg">
                                <Label
                                    htmlFor="nhs_left_ear"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Left Ear Pass
                                </Label>
                                <Switch
                                    id="nhs_left_ear"
                                    checked={form.nhs_left_ear}
                                    onCheckedChange={(checked) =>
                                        updateForm('nhs_left_ear', checked)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* POS (Pulse Oximetry Screening) */}
                <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="h-8 w-1 bg-purple-500 rounded-full" />
                        <div>
                            <h3 className="text-lg font-semibold">Pulse Oximetry</h3>
                            <p className="text-sm text-muted-foreground">POS Results</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Screening Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={'outline'}
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !pos_date && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {pos_date ? (
                                            format(pos_date, 'PPP')
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={pos_date}
                                        onSelect={(date) => {
                                            set_pos_date(date)
                                            updateForm(
                                                'pos_date',
                                                date ? date.toISOString().split('T')[0] : ''
                                            )
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-2 p-3 bg-muted rounded-lg">
                                <Label
                                    htmlFor="pos_for_cchd_right"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Right Hand/Foot Pass
                                </Label>
                                <Switch
                                    id="pos_for_cchd_right"
                                    checked={form.pos_for_cchd_right}
                                    onCheckedChange={(checked) =>
                                        updateForm('pos_for_cchd_right', checked)
                                    }
                                />
                            </div>
                            <div className="flex flex-col space-y-2 p-3 bg-muted rounded-lg">
                                <Label
                                    htmlFor="pos_for_cchd_left"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Left Hand/Foot Pass
                                </Label>
                                <Switch
                                    id="pos_for_cchd_left"
                                    checked={form.pos_for_cchd_left}
                                    onCheckedChange={(checked) =>
                                        updateForm('pos_for_cchd_left', checked)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROR Section */}
                <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="h-8 w-1 bg-orange-500 rounded-full" />
                        <div>
                            <h3 className="text-lg font-semibold">Red Reflex Test</h3>
                            <p className="text-sm text-muted-foreground">ROR Results</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Test Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={'outline'}
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !ror_date && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {ror_date ? (
                                            format(ror_date, 'PPP')
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={ror_date}
                                        onSelect={(date) => {
                                            set_ror_date(date)
                                            updateForm(
                                                'ror_date',
                                                date ? date.toISOString().split('T')[0] : ''
                                            )
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Comments</Label>
                            <Textarea
                                className="min-h-[100px] resize-none"
                                placeholder="Enter detailed observations and remarks"
                                value={form.ror_remarks}
                                onChange={(e) => updateForm('ror_remarks', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ScreeningSection
