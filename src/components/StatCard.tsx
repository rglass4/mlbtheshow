interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

export const StatCard = ({ label, value, hint }: StatCardProps) => (
  <div className="stat-card">
    <span>{label}</span>
    <strong>{value}</strong>
    {hint ? <small>{hint}</small> : null}
  </div>
);
