import Dashboard from "../components/admin/Dashboard";
import Reportes from "../components/admin/Reportes";
import StaffManagement from "../components/admin/Gestion_de_personal";
import Sucursales from "../components/admin/Sucursales";
import ClientesPrincipalesScreen from "../components/admin/ClientesPrincipalesScreen";
import ProductosScreen from "../components/admin/ProductosScreen";
import CierresAdminScreen from "../components/admin/CierresAdminScreen";
import TasaScreen from "../components/admin/TasaScreen";

export default function AdminScreen({ activeView }) {
  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden pt-14 lg:pt-0">
      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeView === "dashboard" && <Dashboard />}
        {activeView === "reportes" && <Reportes />}
        {activeView === "sucursales" && <Sucursales />}
        {activeView === "personal" && <StaffManagement />}
        {activeView === "clientes-top" && <ClientesPrincipalesScreen />}
        {activeView === "productos" && <ProductosScreen />}
        {activeView === "cierres" && <CierresAdminScreen />}
        {activeView === "tasa" && <TasaScreen />}
      </div>
    </div>
  );
}
