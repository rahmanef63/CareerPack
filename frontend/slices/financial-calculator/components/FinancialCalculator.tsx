"use client";

import { useState } from "react";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { useFinancialPlan } from "../hooks/useFinancialPlan";
import { BudgetTab } from "./financial-calculator/BudgetTab";
import { SalaryTab } from "./financial-calculator/SalaryTab";
import { CityCompareTab } from "./financial-calculator/CityCompareTab";

export function FinancialCalculator() {
  const [activeTab, setActiveTab] = useState("budget");
  const [selectedCity, setSelectedCity] = useState("Jakarta");
  const [compareCity, setCompareCity] = useState("Singapore");
  const [targetPosition, setTargetPosition] = useState("Software Engineer");

  const plan = useFinancialPlan();

  return (
    // xl (max-w-7xl), not lg: every tab is now a two-column
    // inputs | results split, and at 6xl the results rail squeezed the
    // sliders and the donut into ~340px.
    <PageContainer size="xl">
      <ResponsivePageHeader
        title="Kalkulator Keuangan"
        description="Rencanakan keuangan Anda dan bandingkan biaya hidup antar kota"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Full-width on mobile; capped on desktop so three tabs don't
            stretch across the whole 1280px container. */}
        <TabsList variant="equal" cols={3} className="lg:max-w-2xl">
          <TabsTrigger value="budget">
            <span className="sm:hidden">Budget</span>
            <span className="hidden sm:inline">Perencanaan Budget</span>
          </TabsTrigger>
          <TabsTrigger value="salary">
            <span className="sm:hidden">Gaji</span>
            <span className="hidden sm:inline">Info Gaji</span>
          </TabsTrigger>
          <TabsTrigger value="compare">
            <span className="sm:hidden">Kota</span>
            <span className="hidden sm:inline">Bandingkan Kota</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-6">
          <BudgetTab {...plan} />
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          <SalaryTab
            targetPosition={targetPosition}
            setTargetPosition={setTargetPosition}
          />
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <CityCompareTab
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            compareCity={compareCity}
            setCompareCity={setCompareCity}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
