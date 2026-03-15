type StatsCardProps = {
  label: string;
  value: string;
};

export function StatsCard({ label, value }: StatsCardProps) {
  return (
    <div className="border border-green-700 p-4">
      <p className="text-xs uppercase text-green-500 mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}