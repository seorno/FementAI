'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from '@/lib/constants';

export default function ShapExplanation({ data }: { data: any[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
          <XAxis type="number" stroke="#9ca3af" />
          <YAxis dataKey="feature" type="category" stroke="#9ca3af" width={100} />
          <Tooltip contentStyle={{ backgroundColor: COLORS.card, borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
          <Bar dataKey="importance" fill={COLORS.warning} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
