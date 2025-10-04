import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'

const AuditFilters = ({
    filters,
    onFilterChange,
    onApplyFilters,
    onResetFilters,
    showFilters,
    onToggleFilters,
}) => {
    return (
        <Card className="mb-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        <CardTitle>Filters</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onToggleFilters}>
                        {showFilters ? 'Hide' : 'Show'}
                    </Button>
                </div>
            </CardHeader>
            {showFilters && (
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="search" className="mb-2">
                                    Search
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="search"
                                        placeholder="Search by user email, name, or table..."
                                        value={filters.search}
                                        onChange={(e) => onFilterChange('search', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="action_type" className="mb-2">
                                    Action Type
                                </Label>
                                <Select
                                    value={filters.action_type || 'all'}
                                    onValueChange={(value) =>
                                        onFilterChange('action_type', value === 'all' ? '' : value)
                                    }
                                >
                                    <SelectTrigger id="action_type">
                                        <SelectValue placeholder="All Actions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Actions</SelectItem>
                                        <SelectItem value="CREATE">Create</SelectItem>
                                        <SelectItem value="UPDATE">Update</SelectItem>
                                        <SelectItem value="DELETE">Delete</SelectItem>
                                        <SelectItem value="VIEW">View</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="table_name" className="mb-2">
                                    Table Name
                                </Label>
                                <Input
                                    id="table_name"
                                    placeholder="e.g., users, patients..."
                                    value={filters.table_name}
                                    onChange={(e) => onFilterChange('table_name', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="start_date" className="mb-2">
                                    Start Date
                                </Label>
                                <Input
                                    id="start_date"
                                    type="datetime-local"
                                    value={filters.start_date}
                                    onChange={(e) => onFilterChange('start_date', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="end_date" className="mb-2">
                                    End Date
                                </Label>
                                <Input
                                    id="end_date"
                                    type="datetime-local"
                                    value={filters.end_date}
                                    onChange={(e) => onFilterChange('end_date', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4 flex justify-end gap-2">
                            <Button variant="ghost" onClick={onResetFilters} size="sm">
                                Reset
                            </Button>
                            <Button onClick={onApplyFilters} size="sm">
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}

export default AuditFilters
