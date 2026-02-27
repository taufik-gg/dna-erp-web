import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

const SYSTEM_PROMPT = `Kamu adalah AI assistant yang membantu mendesain layout dashboard untuk sistem ERP.

User akan memberikan instruksi dalam Bahasa Indonesia untuk menambah, mengubah, atau menghapus komponen di layout.

KOMPONEN YANG TERSEDIA:
1. summary-card - Card untuk menampilkan summary/total (icon: 📊)
2. kpi-card - Card untuk KPI dengan target (icon: 🎯)
3. data-table - Tabel data (icon: 📋)
4. chart-bar - Bar chart (icon: 📈)
5. chart-pie - Pie chart (icon: 🥧)
6. chart-line - Line chart (icon: 📉)
7. form - Form input (icon: 📝)
8. alert-box - Box untuk alert/notifikasi (icon: 🔔)
9. status-flow - Workflow status indicator (icon: 🔄)
10. approval-list - List pending approval (icon: ✅)

UKURAN:
- w: lebar (1-3 kolom, 3 = full width)
- h: tinggi (1-3 baris)

WARNA: blue, green, yellow, red, purple

FORMAT RESPONSE (JSON):
{
  "action": "add" | "remove" | "update" | "clear" | "rearrange",
  "explanation": "Penjelasan dalam Bahasa Indonesia",
  "components": [
    {
      "id": "unique-id",
      "type": "component-type",
      "title": "Component Title",
      "icon": "emoji",
      "w": 1,
      "h": 1,
      "x": 0,
      "y": 0,
      "props": {
        "label": "Label",
        "color": "blue",
        "title": "Title"
      }
    }
  ],
  "targetId": "id-komponen-yang-diupdate" (untuk action update/remove)
}

CONTOH INSTRUKSI & RESPONSE:

User: "Tambahkan 3 summary card untuk pending, approved, rejected"
Response: {
  "action": "add",
  "explanation": "Saya menambahkan 3 summary card untuk status Pending, Approved, dan Rejected",
  "components": [
    {"id": "summary-pending-xxx", "type": "summary-card", "title": "Summary Card", "icon": "📊", "w": 1, "h": 1, "x": 0, "y": 0, "props": {"label": "Pending", "value": "0", "color": "yellow"}},
    {"id": "summary-approved-xxx", "type": "summary-card", "title": "Summary Card", "icon": "📊", "w": 1, "h": 1, "x": 1, "y": 0, "props": {"label": "Approved", "value": "0", "color": "green"}},
    {"id": "summary-rejected-xxx", "type": "summary-card", "title": "Summary Card", "icon": "📊", "w": 1, "h": 1, "x": 2, "y": 0, "props": {"label": "Rejected", "value": "0", "color": "red"}}
  ]
}

User: "Tambahkan table full width di bawah"
Response: {
  "action": "add",
  "explanation": "Saya menambahkan data table dengan lebar penuh (3 kolom)",
  "components": [
    {"id": "table-xxx", "type": "data-table", "title": "Data Table", "icon": "📋", "w": 3, "h": 2, "x": 0, "y": 1, "props": {"title": "Data Table", "columns": ["ID", "Name", "Status"], "pageSize": 10}}
  ]
}

User: "Hapus semua komponen"
Response: {
  "action": "clear",
  "explanation": "Saya menghapus semua komponen dari canvas",
  "components": []
}

PENTING:
- Selalu generate ID unik dengan format: {type}-{timestamp}
- Untuk posisi y, perhatikan komponen yang sudah ada
- Response HARUS dalam format JSON valid
- Gunakan Bahasa Indonesia untuk explanation`;

export async function POST(request: NextRequest) {
  try {
    const { message, currentComponents } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return handleWithoutAI(message, currentComponents);
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Layout saat ini:\n${JSON.stringify(currentComponents, null, 2)}\n\nInstruksi user: "${message}"\n\nBerikan response dalam format JSON.`
        }
      ]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);

        // Ensure unique IDs with timestamp
        if (result.components) {
          result.components = result.components.map((comp: any) => ({
            ...comp,
            id: comp.id.includes('-') && !comp.id.match(/-\d{13}$/)
              ? `${comp.id}-${Date.now()}`
              : comp.id.replace(/xxx$/, Date.now().toString())
          }));
        }
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Parse error:', textContent.text);
      return NextResponse.json({
        action: 'none',
        explanation: 'Maaf, saya tidak dapat memproses permintaan tersebut. Coba instruksi yang lebih spesifik.',
        components: []
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Layout error:', error);
    return NextResponse.json({
      error: 'Failed to process AI request',
      explanation: 'Terjadi kesalahan. Silakan coba lagi.'
    }, { status: 500 });
  }
}

// Fallback without AI
function handleWithoutAI(message: string, currentComponents: any[]) {
  const lower = message.toLowerCase();
  const timestamp = Date.now();

  // Simple pattern matching
  if (lower.includes('hapus semua') || lower.includes('clear') || lower.includes('kosongkan')) {
    return NextResponse.json({
      action: 'clear',
      explanation: 'Semua komponen telah dihapus dari canvas.',
      components: []
    });
  }

  if (lower.includes('summary') || lower.includes('card')) {
    const count = lower.match(/(\d+)/)?.[1] || '1';
    const num = Math.min(parseInt(count), 3);
    const colors = ['blue', 'green', 'yellow'];
    const labels = ['Total', 'Approved', 'Pending'];

    const components = Array.from({ length: num }, (_, i) => ({
      id: `summary-card-${timestamp}-${i}`,
      type: 'summary-card',
      title: 'Summary Card',
      icon: '📊',
      w: 1,
      h: 1,
      x: i,
      y: Math.floor(currentComponents.length / 3),
      props: { label: labels[i] || `Card ${i + 1}`, value: '0', color: colors[i] || 'blue' }
    }));

    return NextResponse.json({
      action: 'add',
      explanation: `Menambahkan ${num} summary card.`,
      components
    });
  }

  if (lower.includes('table') || lower.includes('tabel')) {
    return NextResponse.json({
      action: 'add',
      explanation: 'Menambahkan data table.',
      components: [{
        id: `data-table-${timestamp}`,
        type: 'data-table',
        title: 'Data Table',
        icon: '📋',
        w: 3,
        h: 2,
        x: 0,
        y: Math.floor(currentComponents.length / 3) + 1,
        props: { title: 'Data Table', columns: ['ID', 'Name', 'Status'], pageSize: 10 }
      }]
    });
  }

  if (lower.includes('chart') || lower.includes('grafik')) {
    const type = lower.includes('pie') ? 'chart-pie' : lower.includes('line') ? 'chart-line' : 'chart-bar';
    const icon = type === 'chart-pie' ? '🥧' : type === 'chart-line' ? '📉' : '📈';

    return NextResponse.json({
      action: 'add',
      explanation: `Menambahkan ${type.replace('chart-', '')} chart.`,
      components: [{
        id: `${type}-${timestamp}`,
        type,
        title: type.replace('chart-', '').charAt(0).toUpperCase() + type.slice(7) + ' Chart',
        icon,
        w: 2,
        h: 2,
        x: 0,
        y: Math.floor(currentComponents.length / 3) + 1,
        props: { title: 'Chart', dataKey: 'value' }
      }]
    });
  }

  return NextResponse.json({
    action: 'none',
    explanation: 'Maaf, tanpa koneksi AI saya hanya bisa memproses perintah sederhana seperti:\n• "Tambahkan 3 summary card"\n• "Tambahkan table"\n• "Tambahkan bar/pie/line chart"\n• "Hapus semua"',
    components: []
  });
}
