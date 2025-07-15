import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import PrivateRoute from './components/auth/PrivateRoutes';
import Unauthorized from "./pages/OtherPage/Unauthorized"
import UsersList from "./components/Usersmanagement/UsersList";
import CarManagement from "./components/Carmanagement/CarManagement";
import HomeUser from "./pages/Dashboard/Home chef";
import CarsList from "./components/Carmanagement/CarsList";
import MaintenanceList from "./components/Carmanagement/MaintenanceList";
import ZonesManagement from "./components/Espace client/ZoneManagement";
import ZoneDetail from "./components/Espace client/ZoneDetail";
import ZoneCarManagement from "./components/Espace client/ZoneCarsManagement";
import BudgetManagement from "./components/Espace client/BudgetManagement";
import CarDetail from "./components/Espace client/CarDetail";
import MaintenanceManagement from "./components/Espace client/MaintenanceManagement";
import TargetManagement from "./components/Espace Admin/TargetManagement";
import HomeParticulier from "./pages/Dashboard/Home particulier";
import ListCars from "./components/Espace particulier/ListCars";
import ListMaintenances from "./components/Espace particulier/ListMaintenances";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>          
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<PrivateRoute requiredRole="ADMIN"><Home/></PrivateRoute>}/>
            <Route path="/profit" element={<PrivateRoute requiredRole="ADMIN"><TargetManagement/></PrivateRoute>}/>

            <Route path="/chef-park" element={<PrivateRoute requiredRole="CHEF_PARK"><HomeUser/></PrivateRoute>}/>
            <Route path="/chef-park/zones" element={<PrivateRoute requiredRole="CHEF_PARK"><ZonesManagement /></PrivateRoute>} />
            <Route path="/chef-park/zones/:zoneId" element={<PrivateRoute requiredRole="CHEF_PARK"><ZoneDetail /></PrivateRoute>} />
            <Route path="/chef-park/zones/:zoneId/cars" element={<PrivateRoute requiredRole="CHEF_PARK"><ZoneCarManagement /></PrivateRoute>} />
            <Route path="/chef-park/budgets" element={<PrivateRoute requiredRole="CHEF_PARK"><BudgetManagement /></PrivateRoute>} />
            <Route path="/chef-park/cars" element={<PrivateRoute requiredRole="CHEF_PARK"><ZoneCarManagement /></PrivateRoute>} />
            <Route path="/chef-park/cars/:carId" element={<PrivateRoute requiredRole="CHEF_PARK"><CarDetail /></PrivateRoute>} />
            <Route path="/chef-park/maintenances" element={<PrivateRoute requiredRole="CHEF_PARK"><MaintenanceManagement /></PrivateRoute>} />            
            <Route path="/chef-park/cars/:carId/maintenances" element={<PrivateRoute requiredRole="CHEF_PARK"><MaintenanceManagement /></PrivateRoute>} />


            <Route path="/all-cars" element={<PrivateRoute requiredRole="ADMIN"><CarsList/></PrivateRoute>}/>
            <Route path="/all-maintenances" element={<PrivateRoute requiredRole="ADMIN"><MaintenanceList/></PrivateRoute>}/>

            <Route path="/particulier" element={<PrivateRoute requiredRole="PARTICULIER"><HomeParticulier/></PrivateRoute>}/>
            <Route path="/particulier/my-cars" element={<PrivateRoute requiredRole="PARTICULIER"><ListCars/></PrivateRoute>}/>
            <Route path="/particulier/my-maintenances" element={<PrivateRoute requiredRole="PARTICULIER"><ListMaintenances/></PrivateRoute>}/>

            {/* Main pages*/}
            <Route path= "/users" element={<PrivateRoute requiredRole="ADMIN"><UsersList/></PrivateRoute>}/>
            <Route path="/users/:userId/cars" element={<PrivateRoute requiredRole="ADMIN"><CarManagement/></PrivateRoute>}/>

            {/* Others Page */}
            <Route path="/user" element = {<Home/>}/>
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
          <Route path="/error-403" element={<Unauthorized/>}/>
        </Routes>
      </Router>
    </>
  );
}
