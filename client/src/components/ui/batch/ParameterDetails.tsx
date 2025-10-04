import { motion } from 'framer-motion';
import {
  Target,
  Star,
  Activity,
  Zap,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface ParameterDetailsTableProps {
  parameters: any[];
  isVerified: boolean;
}

const ParameterDetailsTable: React.FC<ParameterDetailsTableProps> = ({
  parameters,
  isVerified,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
      {/* Verification Status Header */}
      <div
        className={`p-4 border-b border-gray-200 ${
          isVerified
            ? 'bg-gradient-to-r from-green-50 to-emerald-50'
            : 'bg-gradient-to-r from-yellow-50 to-amber-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${
              isVerified ? 'bg-green-100' : 'bg-yellow-100'
            }`}
          >
            {isVerified ? (
              <CheckCircle className="text-green-600" size={18} />
            ) : (
              <Clock className="text-yellow-600" size={18} />
            )}
          </div>
          <div>
            <h4
              className={`font-bold ${
                isVerified ? 'text-green-900' : 'text-yellow-900'
              }`}
            >
              {isVerified
                ? 'Verification Completed'
                : 'Verification Not Completed Yet'}
            </h4>
            <p
              className={`text-sm ${
                isVerified ? 'text-green-700' : 'text-yellow-700'
              }`}
            >
              {isVerified
                ? 'All parameters have been verified and test results are available'
                : 'Parameters are awaiting verification - test results will be shown once completed'}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <th className="text-left p-4 font-bold text-gray-900 border-r border-gray-200">
                <div className="flex items-center space-x-2">
                  <Target size={16} className="text-gray-600" />
                  <span>Parameter</span>
                </div>
              </th>
              <th className="text-left p-4 font-bold text-gray-900 border-r border-gray-200">
                <div className="flex items-center space-x-2">
                  <Star size={16} className="text-gray-600" />
                  <span>Standard Value</span>
                </div>
              </th>
              <th className="text-left p-4 font-bold text-gray-900 border-r border-gray-200">
                <div className="flex items-center space-x-2">
                  <Activity size={16} className="text-gray-600" />
                  <span>Unit</span>
                </div>
              </th>
              <th className="text-left p-4 font-bold text-gray-900 border-r border-gray-200">
                <div className="flex items-center space-x-2">
                  <Zap size={16} className="text-gray-600" />
                  <span>Test Result</span>
                </div>
              </th>
              <th className="text-left p-4 font-bold text-gray-900">
                <div className="flex items-center space-x-2">
                  <FileText size={16} className="text-gray-600" />
                  <span>Remarks</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((parameter, index) => {
              // Check if this specific parameter has any value or verification data
              const hasValue = parameter.value && parameter.value.trim() !== '';
              const hasVerificationResult =
                parameter.verificationResult &&
                parameter.verificationResult.trim() !== '';
              const hasVerificationRemark =
                parameter.verificationRemark &&
                parameter.verificationRemark.trim() !== '';

              return (
                <motion.tr
                  key={parameter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="p-4 border-r border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        {parameter.parameter?.name}
                      </p>
                      {parameter.parameter?.description && (
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {parameter.parameter.description}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="p-4 border-r border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {parameter.standardDefinition?.standardValue ||
                          parameter.value ||
                          'N/A'}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 border-r border-gray-200">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                      {parameter.standardDefinition?.unit?.symbol ||
                        parameter.unit?.symbol ||
                        '-'}
                    </span>
                  </td>

                  <td className="p-4 border-r border-gray-200">
                    <div
                      className={`p-3 rounded-xl text-sm font-medium ${
                        hasVerificationResult
                          ? 'bg-green-50 border border-green-200 text-green-900'
                          : hasValue
                            ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
                            : 'bg-gray-50 border border-gray-200 text-gray-500'
                      }`}
                    >
                      {hasVerificationResult
                        ? parameter.verificationResult
                        : hasValue
                          ? 'Awaiting verification'
                          : 'No test data'}
                    </div>
                  </td>

                  <td className="p-4">
                    <div
                      className={`p-3 rounded-xl text-sm ${
                        hasVerificationRemark
                          ? 'bg-blue-50 border border-blue-200 text-blue-900'
                          : hasValue
                            ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                            : 'bg-gray-50 border border-gray-200 text-gray-500'
                      }`}
                    >
                      {hasVerificationRemark
                        ? parameter.verificationRemark
                        : hasValue
                          ? 'No remarks yet'
                          : 'No data available'}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParameterDetailsTable;
