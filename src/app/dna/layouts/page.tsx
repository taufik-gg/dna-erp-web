'use client';

import { LAYOUTS, getAllLayouts, PageLayout, LayoutComponent } from '@/generated/layout-config';
import Link from 'next/link';

// Component renderers
function SummaryCard({ props }: { props: Record<string, any> }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[props.color] || colorClasses.blue}`}>
      <div className="text-sm opacity-75">{props.label}</div>
      <div className="text-3xl font-bold mt-1">{props.value}</div>
    </div>
  );
}

function KPICard({ props }: { props: Record<string, any> }) {
  return (
    <div className="p-4 rounded-lg border-2 bg-white">
      <div className="text-sm text-gray-500">{props.label}</div>
      <div className="text-2xl font-bold mt-1">{props.value}</div>
      <div className="text-xs text-gray-400 mt-1">Target: {props.target}</div>
    </div>
  );
}

function DataTable({ props }: { props: Record<string, any> }) {
  return (
    <div className="p-4 rounded-lg border bg-white">
      <div className="font-semibold mb-3">{props.title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {props.columns?.map((col: string) => (
              <th key={col} className="text-left py-2 px-2">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            {props.columns?.map((col: string, i: number) => (
              <td key={i} className="py-2 px-2 text-gray-500">Sample data...</td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="text-xs text-gray-400 mt-2">Page size: {props.pageSize} rows</div>
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
    <div className="p-4 rounded-lg border bg-white flex flex-col items-center justify-center h-full">
      <div className="text-4xl mb-2">{icons[type] || '📊'}</div>
      <div className="font-semibold">{props.title}</div>
      <div className="text-xs text-gray-400 mt-1">{type.replace('chart-', '')} chart placeholder</div>
    </div>
  );
}

function AlertBox({ props }: { props: Record<string, any> }) {
  const typeClasses: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
  };

  return (
    <div className={`p-4 rounded-lg border ${typeClasses[props.type] || typeClasses.info}`}>
      <div className="font-semibold flex items-center gap-2">
        <span>🔔</span>
        {props.title}
      </div>
    </div>
  );
}

function StatusFlow({ props }: { props: Record<string, any> }) {
  return (
    <div className="p-4 rounded-lg border bg-white">
      <div className="font-semibold mb-3">{props.title}</div>
      <div className="flex items-center gap-2">
        {props.steps?.map((step: string, i: number) => (
          <span key={step} className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm">{step}</span>
            {i < props.steps.length - 1 && <span className="text-gray-400">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function ApprovalList({ props }: { props: Record<string, any> }) {
  return (
    <div className="p-4 rounded-lg border bg-white">
      <div className="font-semibold mb-3 flex items-center gap-2">
        <span>✅</span>
        {props.title}
      </div>
      <div className="text-sm text-gray-500">No pending approvals</div>
    </div>
  );
}

function FormPlaceholder({ props }: { props: Record<string, any> }) {
  return (
    <div className="p-4 rounded-lg border bg-white">
      <div className="font-semibold mb-3">{props.title}</div>
      <div className="space-y-2">
        {props.fields?.map((field: string) => (
          <div key={field}>
            <label className="text-xs text-gray-500">{field}</label>
            <input type="text" disabled className="w-full px-2 py-1 border rounded text-sm bg-gray-50" placeholder={field} />
          </div>
        ))}
      </div>
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
        <div className="p-4 rounded-lg border bg-gray-100">
          <div className="text-sm text-gray-500">Unknown: {component.type}</div>
        </div>
      );
  }
}

// Layout preview component
function LayoutPreview({ layout }: { layout: PageLayout }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{layout.pageName}</h3>
          <p className="text-xs text-gray-500">
            {layout.components.length} components | Updated: {new Date(layout.lastUpdated).toLocaleString('id-ID')}
          </p>
        </div>
        <Link
          href={`/dna/layouts/${layout.pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          View Full
        </Link>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 auto-rows-[100px]">
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
    </div>
  );
}

export default function LayoutsPage() {
  const layouts = getAllLayouts();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">DNA Layouts</h1>
          <p className="text-gray-500">
            UI layouts auto-generated from DNA Repository
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dna"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            ← Back to DNA
          </Link>
          <Link
            href="/dna/layout-editor"
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600"
          >
            🎨 Layout Editor
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-500">Total Layouts</div>
          <div className="text-3xl font-bold text-blue-600">{layouts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-500">Total Components</div>
          <div className="text-3xl font-bold text-green-600">
            {layouts.reduce((sum, l) => sum + l.components.length, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-500">Last Updated</div>
          <div className="text-lg font-bold text-purple-600">
            {layouts.length > 0
              ? new Date(Math.max(...layouts.map(l => new Date(l.lastUpdated).getTime()))).toLocaleDateString('id-ID')
              : '-'}
          </div>
        </div>
      </div>

      {/* Layout List */}
      {layouts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-4xl mb-3">📦</div>
          <div className="text-gray-500 mb-4">No layouts yet</div>
          <Link
            href="/dna/layout-editor"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🎨 Create Layout
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {layouts.map((layout) => (
            <LayoutPreview key={layout.pageName} layout={layout} />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">How DNA Layouts Work</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Create layouts using the Layout Editor (drag & drop)</li>
          <li>Save to DNA Repository (auto-commits to GitHub)</li>
          <li>GitHub webhook triggers the orchestrator</li>
          <li>Orchestrator generates layout-config.ts</li>
          <li>ERP web rebuilds and displays new layouts</li>
        </ol>
      </div>
    </div>
  );
}
