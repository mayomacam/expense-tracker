import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Calendar,
  Sparkles,
  CheckCheck,
  Send,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { BudgetAlert } from '../../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    alerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    triggerTestNotification,
    settings,
    updateSettings,
  } = useExpense();

  const [filter, setFilter] = useState<'all' | 'danger' | 'warning' | 'info'>('all');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'danger':
        return <AlertOctagon className="w-4 h-4 text-[#ff5f5f]" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#c1ff72]" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'danger':
        return 'bg-[#ff5f5f]/10 text-[#ff5f5f] border-[#ff5f5f]/30';
      case 'warning':
        return 'bg-amber-400/10 text-amber-400 border-amber-400/30';
      case 'success':
        return 'bg-[#c1ff72]/10 text-[#c1ff72] border-[#c1ff72]/30';
      default:
        return 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-[#111114] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-md font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#c1ff72] text-black flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Automated Budget Alerts & Notifications
                </h3>
                <p className="text-xs text-zinc-400">
                  {alerts.length} total generated alerts ({alerts.filter((a) => !a.read).length} unread)
                </p>
              </div>
            </div>
            <button
              id="close-notifications-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Settings Bar & Filter Tabs */}
          <div className="px-6 py-3 bg-white/[0.01] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              {(['all', 'danger', 'warning', 'info'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors uppercase text-[11px] ${
                    filter === f
                      ? 'bg-[#c1ff72] text-black shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                      : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5 hover:bg-white/10'
                  }`}
                >
                  {f === 'danger' ? 'Exceeded' : f === 'all' ? 'All Alerts' : f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllAlertsAsRead}
                className="text-xs text-[#c1ff72] hover:text-[#b0f05f] font-semibold flex items-center gap-1 uppercase text-[11px]"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark read
              </button>
              <button
                type="button"
                onClick={() => triggerTestNotification()}
                className="text-xs text-zinc-300 hover:text-white font-medium flex items-center gap-1 px-2 py-0.5 rounded-md border border-white/10 bg-white/5 uppercase text-[10px]"
                title="Send test browser push notification"
              >
                <Send className="w-3 h-3 text-[#c1ff72]" />
                Test Push
              </button>
            </div>
          </div>

          {/* Alert List */}
          <div className="flex-1 p-6 space-y-3 overflow-y-auto">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-[#c1ff72]/10 text-[#c1ff72] mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">All Clear! No active alerts</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  Your daily prorated spending, monthly budget caps, and upcoming recurring bills are
                  all on track.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => markAlertAsRead(alert.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    alert.read
                      ? 'bg-white/[0.02] border-white/[0.06] opacity-70'
                      : 'bg-white/[0.04] border-[#c1ff72]/30 ring-1 ring-[#c1ff72]/20 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-1 rounded-md bg-white/5 border border-white/10 shrink-0">
                        {getAlertIcon(alert.severity)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getSeverityBadgeClass(
                              alert.severity
                            )}`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {alert.date}
                          </span>
                          {alert.linkTab && onNavigateTab && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateTab(alert.linkTab!);
                                onClose();
                              }}
                              className="text-[#c1ff72] hover:text-[#b0f05f] font-semibold underline underline-offset-2"
                            >
                              View in {alert.linkTab} →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer toggle */}
          <div className="px-6 py-3 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-xs text-zinc-400">
            <span>Automated Push Notifications:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotificationsEnabled}
                onChange={(e) => updateSettings({ pushNotificationsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c1ff72] peer-checked:after:bg-black"></div>
            </label>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
