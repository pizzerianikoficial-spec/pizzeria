import { Trophy, Star, TrendingUp, CalendarDays, ShoppingBag } from 'lucide-react';

export default function TopCustomerCard() {
  const topCustomer = {
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    memberSince: 'Enero 2023',
    totalPurchases: 42,
    totalSpent: 1250.50,
    favoriteItem: 'Pizza Pepperoni Suprema',
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg border border-slate-700 p-6 flex flex-col h-full text-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-pizza-red/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.4)]">
            <Trophy className="w-6 h-6 text-yellow-900" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl tracking-tight text-white">Cliente Top</h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Mayor Valor de Vida (LTV)</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
              {topCustomer.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-lg">{topCustomer.name}</h4>
              <p className="text-slate-400 text-sm">{topCustomer.email}</p>
            </div>
            <div className="ml-auto text-right">
              <span className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded-lg text-sm">
                <Star className="w-4 h-4 fill-current" />
                VIP
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-pizza-red opacity-80" />
              <div>
                <p className="text-slate-400 text-xs font-semibold">Compras Totales</p>
                <p className="font-bold text-lg">{topCustomer.totalPurchases}</p>
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-400 opacity-80" />
              <div>
                <p className="text-slate-400 text-xs font-semibold">Valor Total</p>
                <p className="font-bold text-lg">${topCustomer.totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Cliente desde: <span className="font-semibold text-white">{topCustomer.memberSince}</span></span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
