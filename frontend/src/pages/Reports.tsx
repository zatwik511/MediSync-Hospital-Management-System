import { usePatients } from '../hooks/usePatients';
import { usePatientHistory, useAppointmentAnalytics, useAdvancedAppointmentAnalytics } from '../hooks/useReports';
import { useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DiagnosticReports } from '../components/DiagnosticReports';
import { FileText, Calendar, TrendingUp, Users, CheckCircle, XCircle, Clock, BarChart2, MessageSquare, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const ALL_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '11:30', '14:00', '14:30', '15:00', '15:30', '16:00',
];
const DAYS = [
  { dow: 1, label: 'Mon' },
  { dow: 2, label: 'Tue' },
  { dow: 3, label: 'Wed' },
  { dow: 4, label: 'Thu' },
  { dow: 5, label: 'Fri' },
  { dow: 6, label: 'Sat' },
  { dow: 0, label: 'Sun' },
];

type Tab = 'patient' | 'analytics';

export function Reports() {
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const [activeTab, setActiveTab] = useState<Tab>('patient');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const { data: history, isLoading: historyLoading } = usePatientHistory(selectedPatientId);
  const { data: analytics, isLoading: analyticsLoading } = useAppointmentAnalytics();
  const { data: advanced, isLoading: advancedLoading } = useAdvancedAppointmentAnalytics();

  if (patientsLoading) return <LoadingSpinner />;

  // Calculate max count for bar chart scaling
  const maxMonthly = Math.max(...(analytics?.monthly.map(m => m.count) || [1]));
  const maxDoctor = Math.max(...(analytics?.byDoctor.map(d => d.count) || [1]));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('patient')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'patient'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Patient Reports
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Appointment Analytics
          </button>
        </div>

        {/* Patient Reports Tab */}
        {activeTab === 'patient' && (
          <div className="space-y-8">
            <div className="card p-6">
              <label htmlFor="patient-select" className="block text-sm font-medium mb-2">
                Select Patient to View Reports
              </label>
              <select
                id="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="input-field max-w-xs"
              >
                <option value="">-- Choose a patient --</option>
                {patients?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatientId && (
              <>
                {historyLoading ? (
                  <LoadingSpinner />
                ) : history ? (
                  <>
                    <DiagnosticReports patientId={selectedPatientId} />
                    <div className="card p-6">
                      <h2 className="text-2xl font-bold mb-6">Patient History</h2>
                      <section className="mb-6">
                        <h3 className="font-semibold text-lg mb-3">Medical Images</h3>
                        {history.medicalImages.length > 0 ? (
                          <div className="space-y-2">
                            {history.medicalImages.map((image) => (
                              <div key={image.id} className="flex justify-between py-2 border-b border-gray-100">
                                <span>{image.type}</span>
                                <span className="text-gray-600">{image.diseaseClassification}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No medical images</p>
                        )}
                      </section>
                      <section>
                        <h3 className="font-semibold text-lg mb-3">Financial Summary</h3>
                        {history.financialHistory.length > 0 ? (
                          <div className="space-y-2">
                            {history.financialHistory.map((task) => (
                              <div key={task.id} className="flex justify-between py-2 border-b border-gray-100">
                                <span>{task.description}</span>
                                <span className="font-medium">£{Number(task.cost).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between py-3 font-bold text-lg">
                              <span>Total Cost</span>
                              <span className="text-primary-500">£{Number(history.totalCost).toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500">No financial records</p>
                        )}
                      </section>
                    </div>
                  </>
                ) : (
                  <div className="card p-6 text-center text-gray-500">No history available</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Appointment Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <LoadingSpinner />
            ) : analytics ? (
              <>
                {/* Top stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-emerald-500">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-500">Total Appointments</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 font-display tabular-nums">{analytics.totalAppointments}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-green-500">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-500">Fulfilment Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 font-display tabular-nums">{analytics.fulfilmentRate}%</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-red-400">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-gray-500">Cancellation Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 font-display tabular-nums">{analytics.cancellationRate}%</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-purple-500">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-gray-500">Active Doctors</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 font-display tabular-nums">{analytics.byDoctor.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly volume chart */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Appointment Volume (Last 6 Months)</h3>
                    {analytics.monthly.length === 0 ? (
                      <p className="text-gray-400 text-sm">No data yet â€” book some appointments first</p>
                    ) : (
                      <div className="flex items-end gap-3 h-36 pt-4">
                        {analytics.monthly.map((m) => (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500 font-medium">{m.count}</span>
                            <div
                              className="w-full bg-blue-500 rounded-t-sm transition-all"
                              style={{ height: `${Math.max((m.count / maxMonthly) * 100, 4)}%` }}
                            />
                            <span className="text-xs text-gray-400 text-center leading-tight">{m.month}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* By status */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Appointments by Status</h3>
                    <div className="space-y-3">
                      {analytics.byStatus.map((s) => {
                        const pct = analytics.totalAppointments > 0
                          ? Math.round((s.count / analytics.totalAppointments) * 100)
                          : 0;
                        const colours: Record<string, string> = {
                          Confirmed: 'bg-green-500',
                          Cancelled: 'bg-red-400',
                          Completed: 'bg-blue-500',
                          Pending: 'bg-yellow-400',
                        };
                        return (
                          <div key={s.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{s.label}</span>
                              <span className="font-semibold">{s.count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${colours[s.label] || 'bg-gray-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* By type */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Appointments by Type</h3>
                    <div className="space-y-3">
                      {analytics.byType.map((t) => {
                        const pct = analytics.totalAppointments > 0
                          ? Math.round((t.count / analytics.totalAppointments) * 100)
                          : 0;
                        return (
                          <div key={t.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{t.label}</span>
                              <span className="font-semibold">{t.count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-purple-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* By doctor */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Appointments per Doctor</h3>
                    <div className="space-y-3">
                      {analytics.byDoctor.map((d) => {
                        const pct = maxDoctor > 0 ? Math.round((d.count / maxDoctor) * 100) : 0;
                        return (
                          <div key={d.name}>
                            <div className="flex justify-between text-sm mb-1">
                              <div>
                                <span className="text-gray-700 font-medium">{d.name}</span>
                                <span className="text-gray-400 text-xs ml-2">{d.specialty}</span>
                              </div>
                              <span className="font-semibold">{d.count}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-teal-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* â”€â”€ Advanced Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {advancedLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
                  </div>
                ) : advanced ? (
                  <>
                    <div className="mt-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Insights</h3>

                      {/* Advanced stat cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        {/* Busiest day */}
                        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-indigo-500">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart2 className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs text-gray-500">Busiest Day</span>
                          </div>
                          {advanced.busiestDays.length > 0 ? (
                            <>
                              <p className="text-xl font-bold text-gray-900">
                                {advanced.busiestDays.reduce((a, b) => a.count >= b.count ? a : b).dayName}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {advanced.busiestDays.reduce((a, b) => a.count >= b.count ? a : b).count} appts
                              </p>
                            </>
                          ) : <p className="text-sm text-gray-400">No data</p>}
                        </div>

                        {/* Busiest slot */}
                        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-cyan-500">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-cyan-500" />
                            <span className="text-xs text-gray-500">Busiest Slot</span>
                          </div>
                          {advanced.busiestSlots.length > 0 ? (
                            <>
                              <p className="text-xl font-bold text-gray-900">{advanced.busiestSlots[0].time}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{advanced.busiestSlots[0].count} appts</p>
                            </>
                          ) : <p className="text-sm text-gray-400">No data</p>}
                        </div>

                        {/* Avg per week */}
                        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-amber-500">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-gray-500">Avg / Week</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">{advanced.avgPerWeek}</p>
                          <p className="text-xs text-gray-400 mt-0.5">last 3 months</p>
                        </div>

                        {/* Top reason */}
                        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-rose-400">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-rose-400" />
                            <span className="text-xs text-gray-500">Top Reason</span>
                          </div>
                          {advanced.topReasons.length > 0 ? (
                            <>
                              <p className="text-sm font-bold text-gray-900 leading-tight">{advanced.topReasons[0].reason}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{advanced.topReasons[0].count} appts</p>
                            </>
                          ) : <p className="text-sm text-gray-400">No reasons logged</p>}
                        </div>

                        {/* Monthly trend */}
                        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-emerald-500">
                          <div className="flex items-center gap-2 mb-2">
                            {advanced.trend.changePercent === null || advanced.trend.changePercent === 0
                              ? <Minus className="w-4 h-4 text-gray-400" />
                              : advanced.trend.changePercent > 0
                              ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                              : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                            <span className="text-xs text-gray-500">This Month</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">{advanced.trend.thisMonth}</p>
                          <p className={`text-xs mt-0.5 font-medium ${
                            advanced.trend.changePercent === null ? 'text-gray-400'
                            : advanced.trend.changePercent > 0 ? 'text-emerald-600'
                            : advanced.trend.changePercent < 0 ? 'text-red-500'
                            : 'text-gray-400'
                          }`}>
                            {advanced.trend.changePercent === null
                              ? 'No prior data'
                              : advanced.trend.changePercent === 0
                              ? 'Same as last month'
                              : `${advanced.trend.changePercent > 0 ? '+' : ''}${advanced.trend.changePercent}% vs last month`}
                          </p>
                        </div>
                      </div>

                      {/* Heatmap grid + Top reasons side by side */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Heatmap */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                          <h4 className="font-semibold text-gray-900 mb-1">Appointment Heatmap</h4>
                          <p className="text-xs text-gray-400 mb-4">Non-cancelled appointments by day and time slot</p>
                          {(() => {
                            const maxCell = Math.max(...advanced.heatmap.map(h => h.count), 1);
                            const cellMap = new Map(
                              advanced.heatmap.map(h => [`${h.day}-${h.time}`, h.count])
                            );
                            return (
                              <div className="overflow-x-auto">
                                <table className="text-xs w-full">
                                  <thead>
                                    <tr>
                                      <th className="w-14 py-1 pr-2 text-right text-gray-400 font-normal">Slot</th>
                                      {DAYS.map(d => (
                                        <th key={d.dow} className="py-1 px-1 text-center text-gray-500 font-medium w-12">{d.label}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ALL_SLOTS.map(slot => (
                                      <tr key={slot}>
                                        <td className="pr-2 py-0.5 text-right text-gray-400 font-mono">{slot}</td>
                                        {DAYS.map(d => {
                                          const count = cellMap.get(`${d.dow}-${slot}`) ?? 0;
                                          const intensity = count / maxCell;
                                          return (
                                            <td key={d.dow} className="px-1 py-0.5">
                                              <div
                                                className="w-full h-7 rounded flex items-center justify-center text-xs font-medium transition-colors"
                                                style={{
                                                  backgroundColor: count === 0
                                                    ? '#f3f4f6'
                                                    : `rgba(37,99,235,${0.12 + 0.88 * intensity})`,
                                                  color: intensity > 0.55 ? '#fff' : intensity > 0 ? '#1e40af' : '#9ca3af',
                                                }}
                                                title={count > 0 ? `${d.label} ${slot}: ${count} appt${count !== 1 ? 's' : ''}` : undefined}
                                              >
                                                {count > 0 ? count : ''}
                                              </div>
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {/* Legend */}
                                <div className="flex items-center gap-2 mt-3 justify-end">
                                  <span className="text-xs text-gray-400">Low</span>
                                  {[0.12, 0.35, 0.55, 0.75, 1].map(a => (
                                    <div key={a} className="w-5 h-4 rounded" style={{ backgroundColor: `rgba(37,99,235,${a})` }} />
                                  ))}
                                  <span className="text-xs text-gray-400">High</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Top reasons */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                          <h4 className="font-semibold text-gray-900 mb-1">Top Appointment Reasons</h4>
                          <p className="text-xs text-gray-400 mb-4">Most frequently recorded</p>
                          {advanced.topReasons.length === 0 ? (
                            <p className="text-sm text-gray-400">No reasons have been logged yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {advanced.topReasons.map((r, i) => {
                                const maxCount = advanced.topReasons[0].count;
                                const pct = Math.round((r.count / maxCount) * 100);
                                return (
                                  <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-gray-700 truncate max-w-[160px]" title={r.reason}>{r.reason}</span>
                                      <span className="font-semibold ml-2 shrink-0">{r.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                      <div className="h-1.5 rounded-full bg-rose-400" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </>
            ) : (
              <div className="card p-6 text-center text-gray-500">Failed to load analytics</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}