import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useEffect, useState } from "react";

export default function MonthlyMaintenanceChart() {
 const [series, setSeries] = useState([{ 
     name: "Maintenance Costs", 
     data: Array(12).fill(0) 
   }]);
 
 
   useEffect(() => {
     const fetchMonthlyData = async () => {
       try {
         const response = await fetch('/api/admin/maintenances/monthly-maintenance', {
           credentials: 'include'
         });
 
         if (!response.ok) throw new Error('Network response failed');
 
         const data = await response.json();
 
         if (!Array.isArray(data)) throw new Error('Invalid data format');
 
         // Ensure we have exactly 12 months of data
         const completeData = data.length === 12 ? data : [...data, ...Array(12 - data.length).fill(0)];
 
         setSeries([{
           name: "Maintenance Costs",
           data: completeData.slice(0, 12) // Ensure only 12 months
         }]);
 
       } catch (error) {
         console.error("Fetch error:", error);
         // Fallback to empty data
         setSeries([{
           name: "Maintenance Costs",
           data: Array(12).fill(0)
         }]);
       }
     };
 
     fetchMonthlyData();
   }, []);
 
   const options: ApexOptions = {
     colors: ["#FF4560"],
     chart: {
       fontFamily: "Outfit, sans-serif",
       type: "bar",
       height: 180,
       toolbar: {
         show: false,
       },
     },
     plotOptions: {
       bar: {
         horizontal: false,
         columnWidth: "39%",
         borderRadius: 5,
         borderRadiusApplication: "end",
       },
     },
     dataLabels: {
       enabled: false,
     },
     stroke: {
       show: true,
       width: 4,
       colors: ["transparent"],
     },
     xaxis: {
       categories: [
         "Jan",
         "Feb",
         "Mar",
         "Apr",
         "May",
         "Jun",
         "Jul",
         "Aug",
         "Sep",
         "Oct",
         "Nov",
         "Dec",
       ],
       axisBorder: {
         show: false,
       },
       axisTicks: {
         show: false,
       },
     },
     legend: {
       show: true,
       position: "top",
       horizontalAlign: "left",
       fontFamily: "Outfit",
     },
     yaxis: {
       title: {
         text: "Cost (TND)",
         style: {
           fontSize: "9px"
         }
       },
     },
     grid: {
       yaxis: {
         lines: {
           show: true,
         },
       },
     },
     fill: {
       opacity: 1,
     },
 
     tooltip: {
       x: {
         show: false,
       },
       y: {
         formatter: (val: number) => `${val}`,
       },
     },
   };
 
   const [isOpen, setIsOpen] = useState(false);
 
   function toggleDropdown() {
     setIsOpen(!isOpen);
   }
 
   function closeDropdown() {
     setIsOpen(false);
   }
   return (
     <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
       <div className="flex items-center justify-between">
         <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
           Monthly Maintenance
         </h3>
         <div className="relative inline-block">
           <button className="dropdown-toggle" onClick={toggleDropdown}>
             <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
           </button>
           <Dropdown
             isOpen={isOpen}
             onClose={closeDropdown}
             className="w-40 p-2"
           >
             <DropdownItem
               onItemClick={closeDropdown}
               className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
             >
               View More
             </DropdownItem>
             <DropdownItem
               onItemClick={closeDropdown}
               className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
             >
               Delete
             </DropdownItem>
           </Dropdown>
         </div>
       </div>
 
       <div className="max-w-full overflow-x-auto custom-scrollbar">
         <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
           <Chart options={options} series={series} type="bar" height={180} />
         </div>
       </div>
     </div>
   );
}
