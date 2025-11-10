import { motion } from 'framer-motion';
import { Target, Star, Zap, FileText, CheckCircle, Clock } from 'lucide-react';

interface ParameterDetailsTableProps {
  parameters: any[];
  isVerified: boolean;
}

const ParameterDetailsTable: React.FC<ParameterDetailsTableProps> = ({
  parameters,
  isVerified,
}) => {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]">
      {/* Verification Status Header */}
      <div
        className={`p-4 border-b border-[var(--color-border)] ${
          isVerified
            ? 'bg-[var(--color-chart-3)]/10'
            : 'bg-[var(--color-muted)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isVerified
                ? 'bg-[var(--color-chart-3)]/20'
                : 'bg-[var(--color-muted)]'
            }`}
          >
            {isVerified ? (
              <CheckCircle className="text-[var(--color-chart-3)]" size={18} />
            ) : (
              <Clock
                className="text-[var(--color-muted-foreground)]"
                size={18}
              />
            )}
          </div>
          <div>
            <h4
              className={`font-semibold text-sm ${
                isVerified
                  ? 'text-[var(--color-chart-3)]'
                  : 'text-[var(--color-muted-foreground)]'
              }`}
            >
              {isVerified ? 'Verification Completed' : 'Verification Pending'}
            </h4>
            <p
              className={`text-xs mt-0.5 ${
                isVerified
                  ? 'text-[var(--color-chart-3)]/80'
                  : 'text-[var(--color-muted-foreground)]'
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
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--color-muted)] border-b border-[var(--color-border)]">
              <th className="text-left p-3 font-semibold text-sm text-[var(--color-foreground)] border-r border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Target
                    size={14}
                    className="text-[var(--color-muted-foreground)]"
                  />
                  <span>Parameter</span>
                </div>
              </th>
              <th className="text-left p-3 font-semibold text-sm text-[var(--color-foreground)] border-r border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Star
                    size={14}
                    className="text-[var(--color-muted-foreground)]"
                  />
                  <span>Standard Value</span>
                </div>
              </th>
              <th className="text-left p-3 font-semibold text-sm text-[var(--color-foreground)] border-r border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Zap
                    size={14}
                    className="text-[var(--color-muted-foreground)]"
                  />
                  <span>Value</span>
                </div>
              </th>
              <th className="text-left p-3 font-semibold text-sm text-[var(--color-foreground)]">
                <div className="flex items-center gap-2">
                  <FileText
                    size={14}
                    className="text-[var(--color-muted-foreground)]"
                  />
                  <span>Remarks</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((parameter, index) => {
              const hasValue = parameter.value && parameter.value.trim() !== '';
              const hasVerificationRemark =
                parameter.verificationRemark &&
                parameter.verificationRemark.trim() !== '';

              return (
                <motion.tr
                  key={parameter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`border-b border-[var(--color-border)] transition-colors ${
                    index % 2 === 0
                      ? 'bg-[var(--color-card)]'
                      : 'bg-[var(--color-muted)]'
                  } hover:bg-[var(--color-primary)]/5`}
                >
                  <td className="p-3 border-r border-[var(--color-border)]">
                    <div>
                      <p className="font-medium text-sm text-[var(--color-foreground)] mb-1">
                        {parameter.parameter?.name}
                      </p>
                      {parameter.parameter?.description && (
                        <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                          {parameter.parameter.description}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="p-3 border-r border-[var(--color-border)]">
                    <span className="font-semibold text-sm text-[var(--color-foreground)]">
                      {parameter.parameter?.standardValue || 'N/A'}
                    </span>
                  </td>

                  <td className="p-3 border-r border-[var(--color-border)]">
                    <span className="font-semibold text-sm text-[var(--color-foreground)]">
                      {parameter.value || 'N/A'}
                    </span>
                  </td>

                  <td className="p-3">
                    <div
                      className={`p-2 rounded-lg text-xs ${
                        hasVerificationRemark
                          ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)]'
                          : hasValue
                            ? 'bg-[var(--color-muted)] border border-[var(--color-border)] text-[var(--color-muted-foreground)]'
                            : 'bg-[var(--color-muted)] border border-[var(--color-border)] text-[var(--color-muted-foreground)]'
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
