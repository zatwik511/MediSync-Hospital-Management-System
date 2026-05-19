import { PatientForm } from '../components/PatientForm';
import { PatientList } from '../components/PatientList';
import { usePatients } from '../hooks/usePatients';
import { useTotalImageCount } from '../hooks/useImages';
import { Users, FileText, Image, Wallet } from 'lucide-react';

export function Dashboard() {
  const { data: patients } = usePatients();
  const { data: totalImages } = useTotalImageCount();

  const totalPatients = patients?.length || 0;
  const totalCost = patients?.reduce((sum, p) => sum + Number(p.totalCost), 0) || 0;

  // Reports = total number of patients who have a diagnosis set
  const totalReports = patients?.filter(p => p.diagnosis && p.diagnosis.trim() !== '').length || 0;

  const stats = [
    {
      label: 'Total Patients',
      value: totalPatients,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Total Healthcare Cost',
      value: `£${totalCost.toFixed(2)}`,
      icon: Wallet,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Reports Generated',
      value: totalReports,
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Medical Images',
      value: totalImages ?? 0,
      icon: Image,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          IMS Healthcare Dashboard
        </h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card p-6">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon size={24} />
                </div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <PatientForm />
          </div>

          {/* Patient List Section */}
          <div className="lg:col-span-2">
            <PatientList />
          </div>
        </div>
      </div>
    </div>
  );
}