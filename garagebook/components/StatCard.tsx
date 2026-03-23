interface Props {
  label: string;
  value: string | number;
  color: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'teal';
  sub?: string;
  icon?: string;
}

export default function StatCard({ label, value, color, sub, icon }: Props) {
  return (
    <div className={`stat-card ${color}`}>
      {icon && <span className="s-icon">{icon}</span>}
      <p className="label">{label}</p>
      <p className="value">{value}</p>
      {sub && <p className="sub">{sub}</p>}
    </div>
  );
}
