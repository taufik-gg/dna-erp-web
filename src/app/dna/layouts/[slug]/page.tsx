'use client';

import { useParams } from 'next/navigation';
import { getLayout, LayoutComponent } from '@/generated/layout-config';
import Link from 'next/link';

// Component renderers (same as layouts page)
function SummaryCard({ props }: { props: Record<string, any> }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`h-full p-6 rounded-xl border-2 ${colorClasses[props.color] || colorClasses.blue} flex flex-col justify-center`}>
      <div className="text-sm opacity-75 font-medium">{props.label}</div>
      <div className="text-4xl font-bold mt-2">{props.value}</div>
    </div>
  );
}

function KPICard({ props }: { props: Record<string, any> }) {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-200',
    green: 'border-green-200',
    yellow: 'border-yellow-200',
    red: 'border-red-200',
    purple: 'border-purple-200',
  };

  return (
    <div className={`h-full p-6 rounded-xl border-2 bg-white ${colorClasses[props.color] || ''} flex flex-col justify-center`}>
      <div className="text-sm text-gray-500 font-medium">{props.label}</div>
      <div className="text-3xl font-bold mt-2">{props.value}</div>
      <div className="text-sm text-gray-400 mt-2">Target: {props.target}</div>
      <div className="mt-3 bg-gray-200 rounded-full h-2">
        <div className="bg-green-500 h-2 rounded-full" style={{ width: '70%' }}></div>
      </div>
    </div>
  );
}

function DataTable({ props }: { props: Record<string, any> }) {
  // Generate sample data
  const sampleData = Array.from({ length: Math.min(props.pageSize || 5, 5) }, (_, i) => ({
    id: i + 1,
    values: props.columns?.map((col: string) => `Sample ${col} ${i + 1}`) || []
  }));

  return (
    <div className="h-full p-6 rounded-xl border bg-white flex flex-col">
      <div className="font-semibold text-lg mb-4">{props.title}</div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {props.columns?.map((col: string) => (
                <th key={col} className="text-left py-3 px-4 font-semibold">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.values.map((val: string, i: number) => (
                  <td key={i} className="py-3 px-4 text-gray-600">{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-400 mt-4 pt-4 border-t">
        Showing {sampleData.length} of {props.pageSize} rows
      </div>
    </div>
  );
}

function ChartPlaceholder({ type, props }: { type: string; props: Record<string, any> }) {
  const icons: Record<string, string> = {
    'chart-bar': '📊',
    'chart-pie': '🥧',
    'chart-line': '📈',
  };

  return (
    <div className="h-full p-6 rounded-xl border bg-white flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">{icons[type] || '📊'}</div>
      <div className="font-semibold text-lg">{props.title}</div>
      <div className="text-sm text-gray-400 mt-2">{type.replace('chart-', '').toUpperCase()} Chart</div>
      <div className="mt-4 text-xs text-gray-300">(Visualization placeholder)</div>
    </div>
  );
}

function AlertBox({ props }: { props: Record<string, any> }) {
  const typeConfig: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'ℹ️' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '⚠️' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '❌' },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✅' },
  };

  const config = typeConfig[props.type] || typeConfig.info;

  return (
    <div className={`h-full p-6 rounded-xl border-2 ${config.bg} ${config.border} ${config.text} flex items-center gap-4`}>
      <span className="text-3xl">{config.icon}</span>
      <div>
        <div className="font-semibold text-lg">{props.title}</div>
        <div className="text-sm opacity-75 mt-1">No active alerts</div>
      </div>
    </div>
  );
}

function StatusFlow({ props }: { props: Record<string, any> }) {
  return (
    <div className="h-full p-6 rounded-xl border bg-white flex flex-col justify-center">
      <div className="font-semibold text-lg mb-4">{props.title}</div>
      <div className="flex items-center gap-3 flex-wrap">
        {props.steps?.map((step: string, i: number) => (
          <span key={step} className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {step}
            </span>
            {i < props.steps.length - 1 && <span className="text-gray-400 text-xl">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function ApprovalList({ props }: { props: Record<string, any> }) {
  const sampleApprovals = [
    { id: 1, title: 'PO-2024-001', requester: 'John Doe', amount: 'Rp 5.000.000' },
    { id: 2, title: 'PO-2024-002', requester: 'Jane Smith', amount: 'Rp 12.000.000' },
  ];

  return (
    <div className="h-full p-6 rounded-xl border bg-white flex flex-col">
      <div className="font-semibold text-lg mb-4 flex items-center gap-2">
        <span>✅</span>
        {props.title}
        {props.showCount && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{sampleApprovals.length}</span>}
      </div>
      <div className="flex-1 space-y-3">
        {sampleApprovals.map((item) => (
          <div key={item.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.requester}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{item.amount}</div>
              <button className="text-xs text-blue-600 hover:underline">Review</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormPlaceholder({ props }: { props: Record<string, any> }) {
  return (
    <div className="h-full p-6 rounded-xl border bg-white flex flex-col">
      <div className="font-semibold text-lg mb-4">{props.title}</div>
      <div className="flex-1 space-y-4">
        {props.fields?.map((field: string) => (
          <div key={field}>
            <label className="text-sm text-gray-600 font-medium">{field}</label>
            <input
              type="text"
              className="w-full mt-1 px-4 py-2 border rounded-lg text-sm bg-gray-50"
              placeholder={`Enter ${field.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Submit
      </button>
    </div>
  );
}

// Render component based on type
function RenderComponent({ component }: { component: LayoutComponent }) {
  switch (component.type) {
    case 'summary-card':
      return <SummaryCard props={component.props} />;
    case 'kpi-card':
      return <KPICard props={component.props} />;
    case 'data-table':
      return <DataTable props={component.props} />;
    case 'chart-bar':
    case 'chart-pie':
    case 'chart-line':
      return <ChartPlaceholder type={component.type} props={component.props} />;
    case 'alert-box':
      return <AlertBox props={component.props} />;
    case 'status-flow':
      return <StatusFlow props={component.props} />;
    case 'approval-list':
      return <ApprovalList props={component.props} />;
    case 'form':
      return <FormPlaceholder props={component.props} />;
    default:
      return (
        <div className="h-full p-6 rounded-xl border bg-gray-100 flex items-center justify-center">
          <div className="text-sm text-gray-500">Unknown component: {component.type}</div>
        </div>
      );
  }
}

export default function LayoutViewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const layout = getLayout(slug);

  if (!layout) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">Layout Not Found</h1>
        <p className="text-gray-500 mb-6">The layout "{slug}" does not exist.</p>
        <Link href="/dna/layouts" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          ← Back to Layouts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dna/layouts" className="text-gray-500 hover:text-gray-700">
              ← Layouts
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium">{layout.pageName}</span>
          </div>
          <h1 className="text-2xl font-bold">{layout.pageName}</h1>
          <p className="text-gray-500">
            {layout.components.length} components | Last updated: {new Date(layout.lastUpdated).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dna/layout-editor"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            🎨 Edit Layout
          </Link>
        </div>
      </div>

      {/* Layout Preview */}
      <div className="bg-gray-100 rounded-2xl p-6 min-h-[600px]">
        <div className="grid grid-cols-3 gap-6 auto-rows-[150px]">
          {layout.components.map((comp) => (
            <div
              key={comp.id}
              style={{
                gridColumn: `span ${comp.w}`,
                gridRow: `span ${comp.h}`,
              }}
            >
              <RenderComponent component={comp} />
            </div>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Component Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Icon</th>
                <th className="text-left py-2 px-4">Type</th>
                <th className="text-left py-2 px-4">Size</th>
                <th className="text-left py-2 px-4">Properties</th>
              </tr>
            </thead>
            <tbody>
              {layout.components.map((comp) => (
                <tr key={comp.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-2xl">{comp.icon}</td>
                  <td className="py-3 px-4 font-mono text-xs">{comp.type}</td>
                  <td className="py-3 px-4">{comp.w}×{comp.h}</td>
                  <td className="py-3 px-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {JSON.stringify(comp.props).slice(0, 50)}...
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
