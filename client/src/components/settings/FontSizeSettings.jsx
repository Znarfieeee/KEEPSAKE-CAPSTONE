import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth'
import { updateFontSize } from '@/api/settings'
import { showToast } from '@/util/alertHelper'

// UI Components
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { Loader2, Type, RotateCcw } from 'lucide-react'

const FontSizeSettings = () => {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [fontSize, setFontSize] = useState(user?.font_size || 16)
    const [hasChanges, setHasChanges] = useState(false)

    // Sync with user context
    useEffect(() => {
        if (user?.font_size) {
            setFontSize(user.font_size)
            setHasChanges(false)
        }
    }, [user?.font_size])

    const handleSliderChange = (value) => {
        const newSize = value[0] // Radix UI Slider returns array
        setFontSize(newSize)
        setHasChanges(newSize !== (user?.font_size || 16))
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            const response = await updateFontSize(fontSize)
            if (response.status === 'success') {
                showToast('success', 'Font size updated successfully')
                if (response.user) {
                    updateUser(response.user)
                }
                setHasChanges(false)
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to update font size')
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setFontSize(16)
        setHasChanges(16 !== (user?.font_size || 16))
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Preview Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <Type className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Font Size Preview</p>
                        <p
                            className="mt-2 text-gray-700"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            This is how text will appear at {fontSize}px. Adjust the slider
                            below to find your preferred reading size.
                        </p>
                    </div>
                </div>
            </div>

            {/* Font Size Slider */}
            <div className="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="font-size-slider" className="text-base font-medium">
                            Text Size
                        </Label>
                        <span className="text-2xl font-semibold text-primary">
                            {fontSize}px
                        </span>
                    </div>

                    <div className="py-4">
                        <Slider
                            id="font-size-slider"
                            min={12}
                            max={20}
                            step={1}
                            value={[fontSize]}
                            onValueChange={handleSliderChange}
                            className="w-full"
                        />
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Small (12px)</span>
                        <span>Default (16px)</span>
                        <span>Large (20px)</span>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                        Choose a font size that&apos;s comfortable for you. This setting will
                        apply across the entire application and sync to all your devices.
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading || fontSize === 16}
                    className="flex items-center gap-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Default
                </Button>

                <Button
                    type="button"
                    onClick={handleSave}
                    disabled={loading || !hasChanges}
                    className="min-w-[120px]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </Button>
            </div>
        </div>
    )
}

export default FontSizeSettings
