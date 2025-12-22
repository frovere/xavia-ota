'use client';

import { LucidePieChart, LucideTrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartData } from '@/lib/tracking-metrics';

const chartConfig = {
  ios: {
    label: 'iOS',
    color: 'var(--color-ios-blue)',
  },
  android: {
    label: 'Android',
    color: 'var(--color-android-green)',
  },
} satisfies ChartConfig;

export function DashboardChartsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-secondary relative">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-full" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-75 w-full" />
        </CardContent>
      </Card>
      <Card className="bg-secondary relative">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-full" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-75 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardCharts({
  iosDownloads,
  androidDownloads,
  chartData,
}: {
  iosDownloads: number;
  androidDownloads: number;
  chartData: ChartData[];
}) {
  const platformData = [
    { name: 'Android', value: androidDownloads, fill: 'var(--color-android-green)' },
    { name: 'iOS', value: iosDownloads, fill: 'var(--color-ios-blue)' },
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LucideTrendingUp className="w-5 h-5" />
            Last 7 Days Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ios"
                  stroke="var(--color-ios-blue)"
                  name="iOS"
                  activeDot={{
                    r: 6,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="android"
                  stroke="var(--color-android-green)"
                  name="Android"
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LucidePieChart className="w-5 h-5" />
            Platform Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value">
                  {platformData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
