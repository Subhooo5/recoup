"use client";

import { Suspense } from "react";

import { AuditFilters } from "@/components/audit/audit-filters";
import { AuditTable } from "@/components/audit/audit-table";
import { PolicyList } from "@/components/audit/policy-list";
import { LoadingSkeleton } from "@/components/data/loading-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AuditWorkspace() {
  return (
    <Tabs defaultValue="audit-log" className="gap-6">
      <TabsList>
        <TabsTrigger value="audit-log">Audit log</TabsTrigger>
        <TabsTrigger value="policies">Policies</TabsTrigger>
      </TabsList>

      <TabsContent value="audit-log">
        <Suspense fallback={<LoadingSkeleton shape="row-list" count={10} />}>
          <div className="grid gap-4">
            <AuditFilters />
            <AuditTable />
          </div>
        </Suspense>
      </TabsContent>

      <TabsContent value="policies">
        <PolicyList />
      </TabsContent>
    </Tabs>
  );
}
