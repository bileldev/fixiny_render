import PageMeta from "../../components/common/PageMeta";
import ZoneMetricsClient from "../../components/Espace client/ZoneMetricsClient";
import MonthlyBudgetClient from "../../components/Espace client/MonthlyBudgetClient";
import MaintenanceStatisticsChart from "../../components/Espace client/StatisticsChartClient";
import MaintenanceMap from "../../components/Espace client/DemographicCardClient";
import RecentMaintenancesClient from "../../components/Espace client/RecentMaintenancesClient";
import MonthlyMaintenanceChartClient from "../../components/Espace client/MonthlyMaintenanceChartClient";
import { useEffect, useState } from "react";

export default function HomeUser() {
  
  return (
    <>
      <PageMeta
        title="Fixiny"
        description="Fixiny"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <ZoneMetricsClient />

          <MonthlyMaintenanceChartClient />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyBudgetClient />
        </div>

        <div className="col-span-12">
          <MaintenanceStatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          < MaintenanceMap/>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentMaintenancesClient />
        </div>
      </div>
    </>
  );
}
