import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #eceef5',
  boxShadow: '0 12px 30px -12px rgba(16,24,40,.25)',
  fontSize: 12,
  fontFamily: 'Plus Jakarta Sans, sans-serif',
};

export const TrendChart = ({ data }) => (
  <div className="h-[280px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="borrowGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eceef5" />
        <XAxis dataKey="month" tick={{ fill: '#8e99b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8e99b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#6b769b' }} />
        <Area
          type="monotone"
          dataKey="borrowed"
          name="Borrowed"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#borrowGradient)"
          activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
        />
        <Area
          type="monotone"
          dataKey="returned"
          name="Returned"
          stroke="#10b981"
          strokeWidth={2}
          fill="transparent"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const AvailabilityChart = ({ data }) => (
  <div className="h-[280px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -24, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eceef5" />
        <XAxis dataKey="name" tick={{ fill: '#8e99b8', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8e99b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f6f7fb' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#6b769b' }} />
        <Bar dataKey="total" name="Total copies" fill="#c7d2fe" radius={[5, 5, 0, 0]} maxBarSize={22} />
        <Bar dataKey="available" name="Available" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const CategoryPieChart = ({ data }) => (
  <div className="h-[260px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3} stroke="none">
          {data.map((entry, index) => (
            <Cell key={entry.name || index} fill={entry.color || ['#6366f1', '#8b5cf6', '#14b8a6', '#f59e0b', '#ec4899'][index % 5]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#6b769b' }} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export const PopularBooksChart = ({ data }) => (
  <div className="h-[280px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#eceef5" />
        <XAxis type="number" tick={{ fill: '#8e99b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="title"
          width={130}
          tick={{ fill: '#545e80', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => (value.length > 20 ? `${value.slice(0, 19)}…` : value)}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f6f7fb' }} />
        <Bar dataKey="count" name="Times borrowed" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
