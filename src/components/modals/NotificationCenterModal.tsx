import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCheck, AlertCircle, AlertTriangle, Info, Check } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { ActiveTab } from '../../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { alerts, markAlertRead, markAllAlertsRead, clearReadAlerts } = useExpense();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigate = (tab: ActiveTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      navigate(tab === 'savings_debt' ? '/savings-debt' : `/${tab}`);
    }
    onClose();
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'success':
        return <Check className="w-5 h-5 text-emerald-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#16161a] border border-[#27272a] rounded-xl p-5 z-10 shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Notifications &amp; Alerts</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {alerts.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[#27272a]/60 text-xs">
          <span className="text-zinc-400">Prorated &amp; Category Budget Warnings</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => markAllAlertsRead()}
              className="text-[#c1ff72] hover:underline"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={() => clearReadAlerts()}
              className="text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 my-2 space-y-1">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No active budget alerts. You are comfortably within spending limits!
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg flex items-start gap-3 transition-colors ${
                  alert.isRead ? 'bg-zinc-900/30 opacity-70' : 'bg-zinc-900/80 border border-zinc-800'
                }`}
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white truncate">{alert.title}</h4>
                    <span className="text-[10px] text-zinc-500">{alert.date}</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => handleNavigate('prorated')}
                      className="text-[11px] text-[#c1ff72] hover:underline font-medium cursor-pointer"
                    >
                      View Limit &rarr;
                    </button>
                    {!alert.isRead && (
                      <button
                        type="button"
                        onClick={() => markAlertRead(alert.id)}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-[#27272a] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
