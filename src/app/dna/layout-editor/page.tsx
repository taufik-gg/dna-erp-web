'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';

// Types
interface LayoutComponent {
  id: string;
  type: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, any>;
}

interface ComponentTemplate {
  type: string;
  title: string;
  icon: string;
  defaultW: number;
  defaultH: number;
  defaultProps: Record<string, any>;
}

// Available component templates
const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  {
    type: 'summary-card',
    title: 'Summary Card',
    icon: '📊',
    defaultW: 1,
    defaultH: 1,
    defaultProps: { label: 'Total', value: '0', color: 'blue' },
  },
  {
    type: 'kpi-card',
    title: 'KPI Card',
    icon: '🎯',
    defaultW: 1,
    defaultH: 1,
    defaultProps: { label: 'KPI', value: '0%', target: '100%', color: 'green' },
  },
  {
    type: 'data-table',
    title: 'Data Table',
    icon: '📋',
    defaultW: 3,
    defaultH: 2,
    defaultProps: { title: 'Data Table', columns: ['ID', 'Name', 'Status'], pageSize: 10 },
  },
  {
    type: 'chart-bar',
    title: 'Bar Chart',
    icon: '📈',
    defaultW: 2,
    defaultH: 2,
    defaultProps: { title: 'Bar Chart', dataKey: 'value' },
  },
  {
    type: 'chart-pie',
    title: 'Pie Chart',
    icon: '🥧',
    defaultW: 2,
    defaultH: 2,
    defaultProps: { title: 'Pie Chart', dataKey: 'value' },
  },
  {
    type: 'chart-line',
    title: 'Line Chart',
    icon: '📉',
    defaultW: 2,
    defaultH: 2,
    defaultProps: { title: 'Line Chart', dataKey: 'value' },
  },
  {
    type: 'form',
    title: 'Form',
    icon: '📝',
    defaultW: 2,
    defaultH: 2,
    defaultProps: { title: 'Form', fields: ['field1', 'field2'] },
  },
  {
    type: 'alert-box',
    title: 'Alert Box',
    icon: '🔔',
    defaultW: 3,
    defaultH: 1,
    defaultProps: { title: 'Alerts', type: 'warning' },
  },
  {
    type: 'status-flow',
    title: 'Status Flow',
    icon: '🔄',
    defaultW: 3,
    defaultH: 1,
    defaultProps: { title: 'Workflow Status', steps: ['Draft', 'Review', 'Approved'] },
  },
  {
    type: 'approval-list',
    title: 'Approval List',
    icon: '✅',
    defaultW: 2,
    defaultH: 2,
    defaultProps: { title: 'Pending Approvals', showCount: true },
  },
];

// Draggable palette item
function PaletteItem({ template }: { template: ComponentTemplate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `palette-${template.type}`,
    data: { type: 'palette', template },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-grab hover:border-blue-400 hover:shadow-sm transition-all"
    >
      <span className="text-2xl">{template.icon}</span>
      <span className="text-sm font-medium">{template.title}</span>
    </div>
  );
}

// Canvas component (placed on grid)
function CanvasComponent({
  component,
  isSelected,
  onSelect,
  onRemove,
}: {
  component: LayoutComponent;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: component.id,
    data: { type: 'canvas', component },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    gridColumn: `span ${component.w}`,
    gridRow: `span ${component.h}`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`relative p-4 bg-white border-2 rounded-lg cursor-move transition-all ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-xs flex items-center justify-center"
      >
        ✕
      </button>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{component.icon}</span>
        <span className="font-medium text-sm">{component.title}</span>
      </div>
      <div className="text-xs text-gray-500">
        {component.w}×{component.h} grid
      </div>
      {component.props.title && (
        <div className="mt-2 text-xs text-gray-600 truncate">
          "{component.props.title}"
        </div>
      )}
    </div>
  );
}

// Droppable canvas area
function Canvas({
  components,
  selectedId,
  onSelect,
  onRemove,
}: {
  components: LayoutComponent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[500px] p-4 border-2 border-dashed rounded-xl transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
      onClick={() => onSelect('')}
    >
      {components.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📦</div>
            <div>Drag components here</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 auto-rows-[120px]">
          <SortableContext items={components.map((c) => c.id)} strategy={rectSortingStrategy}>
            {components.map((comp) => (
              <CanvasComponent
                key={comp.id}
                component={comp}
                isSelected={selectedId === comp.id}
                onSelect={() => onSelect(comp.id)}
                onRemove={() => onRemove(comp.id)}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// Properties panel
function PropertiesPanel({
  component,
  onChange,
}: {
  component: LayoutComponent | null;
  onChange: (updated: LayoutComponent) => void;
}) {
  if (!component) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-2xl mb-2">👆</div>
        <div>Select a component to edit properties</div>
      </div>
    );
  }

  const updateProp = (key: string, value: any) => {
    onChange({
      ...component,
      props: { ...component.props, [key]: value },
    });
  };

  const updateSize = (w: number, h: number) => {
    onChange({ ...component, w, h });
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{component.icon}</span>
          <span className="font-medium">{component.title}</span>
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Size (columns × rows)</label>
        <div className="flex gap-2">
          <select
            value={component.w}
            onChange={(e) => updateSize(parseInt(e.target.value), component.h)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          >
            <option value={1}>1 col</option>
            <option value={2}>2 col</option>
            <option value={3}>3 col (full)</option>
          </select>
          <select
            value={component.h}
            onChange={(e) => updateSize(component.w, parseInt(e.target.value))}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          >
            <option value={1}>1 row</option>
            <option value={2}>2 rows</option>
            <option value={3}>3 rows</option>
          </select>
        </div>
      </div>

      {/* Dynamic props based on component type */}
      {component.props.title !== undefined && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={component.props.title || ''}
            onChange={(e) => updateProp('title', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      )}

      {component.props.label !== undefined && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={component.props.label || ''}
            onChange={(e) => updateProp('label', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      )}

      {component.props.color !== undefined && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <select
            value={component.props.color || 'blue'}
            onChange={(e) => updateProp('color', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="yellow">Yellow</option>
            <option value="red">Red</option>
            <option value="purple">Purple</option>
          </select>
        </div>
      )}

      {component.props.pageSize !== undefined && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
          <select
            value={component.props.pageSize || 10}
            onChange={(e) => updateProp('pageSize', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      )}

      {component.type === 'alert-box' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
          <select
            value={component.props.type || 'warning'}
            onChange={(e) => updateProp('type', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
        </div>
      )}
    </div>
  );
}

// AI Chat Message interface
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// AI Chat Panel Component
function AIChatPanel({
  isOpen,
  onClose,
  onApplyComponents,
  onClearComponents,
  currentComponents,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApplyComponents: (components: LayoutComponent[]) => void;
  onClearComponents: () => void;
  currentComponents: LayoutComponent[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya AI assistant untuk membantu mendesain layout. Contoh perintah:\n\n• "Tambahkan 3 summary card untuk pending, approved, rejected"\n• "Tambahkan table full width di bawah"\n• "Tambahkan pie chart dan bar chart"\n• "Hapus semua komponen"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/dna/ai-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          currentComponents,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.explanation || 'Perintah diproses.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Apply the action
      if (data.action === 'add' && data.components) {
        onApplyComponents([...currentComponents, ...data.components]);
      } else if (data.action === 'clear') {
        onClearComponents();
      } else if (data.action === 'update' && data.components) {
        // Update existing components
        const updatedIds = new Set(data.components.map((c: any) => c.id));
        const remaining = currentComponents.filter((c) => !updatedIds.has(c.id));
        onApplyComponents([...remaining, ...data.components]);
      }
    } catch (error) {
      console.error('AI error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          timestamp: new Date(),
        },
      ]);
    }

    setLoading(false);
  };

  const quickActions = [
    { label: '3 Summary Cards', prompt: 'Tambahkan 3 summary card untuk Pending, Approved, Rejected' },
    { label: 'Data Table', prompt: 'Tambahkan data table full width' },
    { label: 'Charts', prompt: 'Tambahkan bar chart dan pie chart' },
    { label: 'Clear All', prompt: 'Hapus semua komponen' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl border flex flex-col z-50" style={{ height: '500px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-semibold">AI Layout Assistant</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-b bg-gray-50 flex gap-2 flex-wrap">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => setInput(action.prompt)}
            className="px-2 py-1 text-xs bg-white border rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="animate-bounce">🤖</div>
                <span className="text-gray-500">Memproses...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik perintah... (cth: tambahkan 3 card)"
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kirim
          </button>
        </div>
      </form>
    </div>
  );
}

// Generate markdown from layout
function generateMarkdown(components: LayoutComponent[], pageName: string): string {
  const rows: LayoutComponent[][] = [];
  let currentRow: LayoutComponent[] = [];
  let currentRowWidth = 0;

  // Simple row-based layout generation
  components.forEach((comp) => {
    if (currentRowWidth + comp.w > 3) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [comp];
      currentRowWidth = comp.w;
    } else {
      currentRow.push(comp);
      currentRowWidth += comp.w;
    }
  });
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Generate markdown
  let md = `---
page: ${pageName}
version: "1.0"
last_updated: ${new Date().toISOString().split('T')[0]}
---

# ${pageName} Layout

## Grid Configuration

\`\`\`yaml
grid:
  columns: 3
  gap: 16px
  row_height: 120px
\`\`\`

## Components

`;

  // Generate layout notation
  rows.forEach((row, rowIndex) => {
    const rowNotation = row.map((comp) => {
      const span = comp.w === 3 ? 'full' : comp.w.toString();
      return `${comp.type}:${span}`;
    }).join(' | ');
    md += `### Row ${rowIndex + 1}\n\`[${rowNotation}]\`\n\n`;
  });

  // Generate component details
  md += `## Component Details\n\n\`\`\`yaml\ncomponents:\n`;

  components.forEach((comp) => {
    md += `  - id: ${comp.id}
    type: ${comp.type}
    size: [${comp.w}, ${comp.h}]
    props:
`;
    Object.entries(comp.props).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        md += `      ${key}: [${value.map((v) => `"${v}"`).join(', ')}]\n`;
      } else if (typeof value === 'string') {
        md += `      ${key}: "${value}"\n`;
      } else {
        md += `      ${key}: ${value}\n`;
      }
    });
    md += '\n';
  });

  md += `\`\`\`\n`;

  return md;
}

// Main Layout Editor Component
export default function LayoutEditorPage() {
  const [components, setComponents] = useState<LayoutComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pageName, setPageName] = useState('Dashboard');
  const [saving, setSaving] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const selectedComponent = components.find((c) => c.id === selectedId) || null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // If dragging from palette to canvas
    if (active.data.current?.type === 'palette' && over.id === 'canvas') {
      const template = active.data.current.template as ComponentTemplate;
      const newComponent: LayoutComponent = {
        id: `${template.type}-${Date.now()}`,
        type: template.type,
        title: template.title,
        icon: template.icon,
        x: 0,
        y: components.length,
        w: template.defaultW,
        h: template.defaultH,
        props: { ...template.defaultProps },
      };
      setComponents([...components, newComponent]);
      setSelectedId(newComponent.id);
    }
  };

  const handleRemove = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleUpdateComponent = (updated: LayoutComponent) => {
    setComponents(components.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const markdown = generateMarkdown(components, pageName);
      const response = await fetch('/api/dna/save-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageName,
          content: markdown,
          components,
        }),
      });

      if (response.ok) {
        alert('Layout saved successfully!');
      } else {
        alert('Failed to save layout');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving layout');
    }
    setSaving(false);
  };

  const markdown = generateMarkdown(components, pageName);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dna" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                🎨 DNA Layout Editor
              </h1>
              <p className="text-sm text-gray-500">Drag and drop to design your dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              placeholder="Page name"
            />
            <button
              onClick={() => setShowMarkdown(!showMarkdown)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showMarkdown ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showMarkdown ? '👁️ Preview' : '</> Markdown'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || components.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '💾 Saving...' : '💾 Save to DNA'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Chat Toggle Button */}
      {!showAIChat && (
        <button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center text-2xl z-40"
        >
          🤖
        </button>
      )}

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        onApplyComponents={setComponents}
        onClearComponents={() => setComponents([])}
        currentComponents={components}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Sidebar - Component Palette */}
          <div className="w-64 bg-white border-r p-4 overflow-y-auto">
            <h2 className="font-semibold text-gray-700 mb-3">📦 Components</h2>
            <div className="space-y-2">
              <SortableContext items={COMPONENT_TEMPLATES.map((t) => `palette-${t.type}`)}>
                {COMPONENT_TEMPLATES.map((template) => (
                  <PaletteItem key={template.type} template={template} />
                ))}
              </SortableContext>
            </div>
          </div>

          {/* Center - Canvas or Markdown */}
          <div className="flex-1 p-6 overflow-y-auto">
            {showMarkdown ? (
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold mb-3">Generated Markdown</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                  {markdown}
                </pre>
              </div>
            ) : (
              <Canvas
                components={components}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onRemove={handleRemove}
              />
            )}
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-72 bg-white border-l overflow-y-auto">
            <div className="border-b px-4 py-3">
              <h2 className="font-semibold text-gray-700">⚙️ Properties</h2>
            </div>
            <PropertiesPanel component={selectedComponent} onChange={handleUpdateComponent} />
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeId.startsWith('palette-') ? (
            <div className="flex items-center gap-3 p-3 bg-white border-2 border-blue-400 rounded-lg shadow-lg">
              <span className="text-2xl">
                {COMPONENT_TEMPLATES.find((t) => `palette-${t.type}` === activeId)?.icon}
              </span>
              <span className="text-sm font-medium">
                {COMPONENT_TEMPLATES.find((t) => `palette-${t.type}` === activeId)?.title}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
