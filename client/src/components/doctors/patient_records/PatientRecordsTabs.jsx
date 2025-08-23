import React from 'react'

// UI Components
import { FileText, Syringe, Pill } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

const TabItem = ({ value, icon: Icon, children }) => (
  <TabsTrigger
    value={value}
    className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
  >
    {Icon && <Icon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />}
    {children}
  </TabsTrigger>
)

const PatientRecordsTabs = () => {
  const tabs = [
    {
      value: 'information',
      label: 'INFORMATION',
      icon: FileText,
      content: (
        <div className="space-y-4">{/* Content for Information tab will be injected here */}</div>
      ),
    },
    {
      value: 'immunization',
      label: 'IMMUNIZATION',
      icon: Syringe,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Immunization records will be displayed here</p>
        </div>
      ),
    },
    {
      value: 'prescription',
      label: 'PRESCRIPTION',
      icon: Pill,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Prescription history will be displayed here</p>
        </div>
      ),
    },
  ]

  return (
    <Tabs defaultValue="information" className="w-full">
      <ScrollArea>
        <TabsList className="text-foreground mb-3 h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
          {tabs.map((tab) => (
            <TabItem key={tab.value} value={tab.value} icon={tab.icon}>
              {tab.label}
            </TabItem>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default PatientRecordsTabs
