import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

const SYSTEM_PROMPT = `Kamu adalah AI assistant yang membantu mengubah konfigurasi DNA (approval thresholds) untuk sistem ERP.

DNA file adalah file markdown dengan format:
1. YAML frontmatter (---)
2. Tabel threshold dengan kolom: Level, Min Amount, Max Amount, Role
3. YAML code block untuk konfigurasi detail

ATURAN PENTING:
1. Selalu gunakan format angka tanpa titik pemisah ribuan di tabel (contoh: 500000, bukan 500.000)
2. Untuk unlimited, gunakan kata "unlimited"
3. Role yang valid: MANAGER, DIRECTOR, CEO, CFO
4. SLA dalam jam (24, 48, 72, dst)
5. Settings boolean: true/false

Ketika user memberikan instruksi, kamu harus:
1. Memahami perubahan yang diminta
2. Menghasilkan DNA file yang sudah dimodifikasi
3. Menjelaskan perubahan dalam Bahasa Indonesia

Format response HARUS dalam JSON:
{
  "explanation": "Penjelasan perubahan dalam Bahasa Indonesia",
  "changes": ["Perubahan 1", "Perubahan 2"],
  "modifiedDNA": "Isi lengkap DNA file yang sudah dimodifikasi",
  "preview": true
}

Jika instruksi tidak jelas atau tidak valid, response:
{
  "explanation": "Penjelasan mengapa tidak bisa diproses",
  "preview": false
}`;

export async function POST(request: NextRequest) {
  try {
    const { message, currentDNA } = await request.json();

    if (!message || !currentDNA) {
      return NextResponse.json({ error: 'Message and currentDNA are required' }, { status: 400 });
    }

    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback to simple rule-based processing if no API key
      return handleWithoutAI(message, currentDNA);
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `DNA saat ini:\n\`\`\`markdown\n${currentDNA}\n\`\`\`\n\nInstruksi user: "${message}"\n\nBerikan response dalam format JSON.`
        }
      ]
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent.text);
      return NextResponse.json({
        explanation: 'Maaf, saya tidak dapat memproses permintaan Anda. Silakan coba dengan instruksi yang lebih spesifik.',
        preview: false
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Edit error:', error);
    return NextResponse.json({
      error: 'Failed to process AI request',
      explanation: 'Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.'
    }, { status: 500 });
  }
}

// Fallback function when no API key
function handleWithoutAI(message: string, currentDNA: string) {
  const lowerMessage = message.toLowerCase();
  let modifiedDNA = currentDNA;
  const changes: string[] = [];
  let explanation = '';

  // Simple pattern matching for common requests
  if (lowerMessage.includes('threshold') && lowerMessage.includes('manager')) {
    const amountMatch = message.match(/(\d+)\s*(juta|ribu|rb|jt)?/i);
    if (amountMatch) {
      let amount = parseInt(amountMatch[1]);
      if (amountMatch[2]?.toLowerCase().includes('juta') || amountMatch[2]?.toLowerCase() === 'jt') {
        amount *= 1000000;
      } else if (amountMatch[2]?.toLowerCase().includes('ribu') || amountMatch[2]?.toLowerCase() === 'rb') {
        amount *= 1000;
      }

      // Update the DNA
      modifiedDNA = currentDNA.replace(
        /(\| 1 \| 0 \| )[\d,]+( \| MANAGER \|)/,
        `$1${amount - 1}$2`
      );
      changes.push(`Threshold Manager diubah menjadi Rp ${amount.toLocaleString('id-ID')}`);
      explanation = `Saya telah mengubah batas maksimal approval untuk Manager menjadi Rp ${amount.toLocaleString('id-ID')}. Silakan review perubahan di panel sebelah kanan.`;
    }
  } else if (lowerMessage.includes('sla') || lowerMessage.includes('jam')) {
    const hoursMatch = message.match(/(\d+)\s*jam/i);
    const roleMatch = message.match(/(manager|director|ceo|cfo)/i);

    if (hoursMatch && roleMatch) {
      const hours = parseInt(hoursMatch[1]);
      const role = roleMatch[1].toUpperCase();

      modifiedDNA = currentDNA.replace(
        new RegExp(`(role: ${role}\\s*\\n\\s*sla_hours: )\\d+`, 'i'),
        `$1${hours}`
      );
      changes.push(`SLA ${role} diubah menjadi ${hours} jam`);
      explanation = `Saya telah mengubah SLA untuk ${role} menjadi ${hours} jam.`;
    }
  } else if (lowerMessage.includes('self approval') || lowerMessage.includes('self_approval')) {
    const enable = lowerMessage.includes('aktif') || lowerMessage.includes('enable') || lowerMessage.includes('nyala');
    modifiedDNA = currentDNA.replace(
      /self_approval: (true|false)/,
      `self_approval: ${enable}`
    );
    changes.push(`Self approval di${enable ? 'aktifkan' : 'nonaktifkan'}`);
    explanation = `Self approval telah di${enable ? 'aktifkan' : 'nonaktifkan'}.`;
  } else {
    return NextResponse.json({
      explanation: 'Maaf, saya belum bisa memproses instruksi tersebut tanpa koneksi AI. Silakan gunakan instruksi yang lebih spesifik seperti:\n\n• "Ubah threshold manager menjadi X juta"\n• "Ubah SLA director menjadi X jam"\n• "Aktifkan/Nonaktifkan self approval"',
      preview: false
    });
  }

  if (changes.length > 0) {
    // Update version
    const versionMatch = currentDNA.match(/version: "(\d+)\.(\d+)"/);
    if (versionMatch) {
      const major = versionMatch[1];
      const minor = parseInt(versionMatch[2]) + 1;
      modifiedDNA = modifiedDNA.replace(
        /version: "\d+\.\d+"/,
        `version: "${major}.${minor}"`
      );
      changes.push(`Version di-bump ke ${major}.${minor}`);
    }

    return NextResponse.json({
      explanation,
      changes,
      modifiedDNA,
      preview: true
    });
  }

  return NextResponse.json({
    explanation: 'Tidak ada perubahan yang dapat dilakukan.',
    preview: false
  });
}
