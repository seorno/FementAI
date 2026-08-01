'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from '@/lib/constants';

export default function FermentationCurve({ data }: { data: any[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="day" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip contentStyle={{ backgroundColor: COLORS.card, borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
          <Line type="monotone" dataKey="pH" stroke={COLORS.info} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="acidity" stroke={COLORS.positive} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
