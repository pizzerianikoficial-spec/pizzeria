import { useState } from 'react';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { CurrencyIcon as CurrencyDollar, Edit2, Check, X } from 'lucide-react';

export default function ExchangeRateWidget() {
  const { exchangeRate, updateExchangeRate } = useExchangeRate();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleEditClick = () => {
    setInputValue(exchangeRate.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0) {
      updateExchangeRate(val);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm">
      <CurrencyDollar className="w-4 h-4 text-emerald-600" />
      <span className="text-xs font-semibold text-slate-500">BCV:</span>
      
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input 
            type="number" 
            step="0.01"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-16 sm:w-20 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:border-pizza-red"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-700 p-0.5">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={handleCancel} className="text-red-500 hover:text-red-600 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Bs. {exchangeRate ? exchangeRate.toFixed(2) : '---'}
          </span>
          <button 
            onClick={handleEditClick}
            className="text-slate-400 hover:text-pizza-red transition-colors"
            title="Editar Tasa"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
