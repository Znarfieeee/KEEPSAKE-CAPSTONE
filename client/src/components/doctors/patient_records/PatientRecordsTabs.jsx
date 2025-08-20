import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const PatientRecordsTabs = () => {
  return (
    <Tabs defaultValue="information" className="w-full">
      <ScrollArea>
        <TabsList className="text-foreground mb-3 h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
          <TabsTrigger
            value="information"
            className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            INFORMATION
          </TabsTrigger>
          <TabsTrigger
            value="immunization"
            className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            IMMUNIZATION
          </TabsTrigger>
          <TabsTrigger
            value="prescription"
            className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            PRESCRIPTION
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <TabsContent value="information" className="mt-6">
        <div className="space-y-4">{/* Content for Information tab will be injected here */}</div>
      </TabsContent>

      <TabsContent value="immunization" className="mt-6">
        <div className="space-y-4">
          {/* Content for Immunization tab */}
          <p className="text-muted-foreground">Immunization records will be displayed here</p>
        </div>
      </TabsContent>

      <TabsContent value="prescription" className="mt-6">
        <div className="space-y-4">
          {/* Content for Prescription tab */}
          <p className="text-muted-foreground">Prescription history will be displayed here</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default PatientRecordsTabs;
