import { usePatientTotalCost } from '../hooks/useFinancial';
import { AlertCircle } from 'lucide-react';

interface CostSummaryProps {
  patientId: string;
}

export function CostSummary({ patientId }: CostSummaryProps) {
  const { data: totalCost, isLoading, error } = usePatientTotalCost(patientId);

  if (error) {
    return (
      <div className="card p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>Failed to load cost data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Total Patient Cost</h3>
      {isLoading ? (
        <div className="h-8 bg-blue-200 rounded animate-pulse"></div>
      ) : (
        <p className="text-4xl font-bold text-blue-600">
          £{Number(totalCost || 0).toFixed(2)}
        </p>
      )}
    </div>
  );
}