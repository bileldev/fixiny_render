import ZoneMetrics from "../../components/Espace Admin/ZoneMetrics";
import MonthlyMaintenanceChart from "../../components/Espace Admin/MonthlyMaintenanceChart";
import MaintenanceStatisticsChart from "../../components/Espace Admin/MaintenanceStatisticsChart";
import MonthlyTarget from "../../components/Espace Admin/MonthlyTarget";
import RecentMaintenances from "../../components/Espace Admin/RecentMaintenances";
import MaintenanceMap from "../../components/Espace Admin/DemographicCard";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Fixiny"
        description="Fixiny"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <ZoneMetrics />

          <MonthlyMaintenanceChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <MaintenanceStatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MaintenanceMap />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentMaintenances />
        </div>
      </div>
    </>
  );
}
