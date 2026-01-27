'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DNAPreview {
  original: string;
  modified: string;
  changes: string[];
}

export default function DNAEditorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Selamat datang di DNA Editor! Saya akan membantu Anda mengubah konfigurasi approval threshold. Contoh perintah:\n\n• "Ubah threshold manager menjadi 1 juta"\n• "Tambah level approval untuk amount di atas 100 juta"\n• "Kurangi SLA director menjadi 24 jam"\n• "Aktifkan fitur self approval"'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDNA, setCurrentDNA] = useState('');
  const [preview, setPreview] = useState<DNAPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load current DNA on mount
  useEffect(() => {
    fetchCurrentDNA();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCurrentDNA = async () => {
    try {
      const res = await fetch('/api/dna/current');
      const data = await res.json();
      setCurrentDNA(data.content);
    } catch (error) {
      console.error('Failed to fetch DNA:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/dna/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentDNA: currentDNA
        })
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Maaf, terjadi kesalahan: ${data.error}`
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.explanation
        }]);

        if (data.preview) {
          setPreview({
            original: currentDNA,
            modified: data.modifiedDNA,
            changes: data.changes || []
          });
          setShowPreview(true);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan saat memproses permintaan Anda.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!preview) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const res = await fetch('/api/dna/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: preview.modified,
          changes: preview.changes
        })
      });

      const data = await res.json();

      if (data.success) {
        setSaveStatus('success');
        setCurrentDNA(preview.modified);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `✅ Perubahan berhasil disimpan dan akan segera diterapkan ke sistem ERP!\n\nCommit: ${data.commitMessage}`
        }]);
        setShowPreview(false);
        setPreview(null);
      } else {
        setSaveStatus('error');
        setMessages(prev => [...prev, {
          role: 'system',
          content: `❌ Gagal menyimpan: ${data.error}`
        }]);
      }
    } catch (error) {
      setSaveStatus('error');
      setMessages(prev => [...prev, {
        role: 'system',
        content: '❌ Gagal menyimpan perubahan. Silakan coba lagi.'
      }]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreview(null);
    setMessages(prev => [...prev, {
      role: 'system',
      content: 'Perubahan dibatalkan. Silakan berikan instruksi baru.'
    }]);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">DNA Editor</h1>
          <p className="text-gray-500">Edit konfigurasi approval dengan bantuan AI</p>
        </div>
        <Link
          href="/dna"
          className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
        >
          ← Kembali
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Interface */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              AI Assistant
            </h2>
            <p className="text-sm text-blue-100">Ketik perintah dalam Bahasa Indonesia</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.role === 'system'
                      ? 'bg-gray-100 text-gray-700 border'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik instruksi... (contoh: ubah threshold manager jadi 2 juta)"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kirim
              </button>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">📝</span>
              {showPreview ? 'Preview Perubahan' : 'Konfigurasi Saat Ini'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {showPreview && preview ? (
              <div className="space-y-4">
                {/* Changes Summary */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Perubahan yang akan diterapkan:</h3>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    {preview.changes.map((change, idx) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>

                {/* Modified DNA Preview */}
                <div>
                  <h3 className="font-semibold mb-2">DNA Baru:</h3>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {preview.modified}
                  </pre>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={handleApplyChanges}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    {isSaving ? 'Menyimpan...' : '✅ Terapkan Perubahan'}
                  </button>
                  <button
                    onClick={handleCancelPreview}
                    disabled={isSaving}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                  {currentDNA || 'Loading...'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Contoh Perintah</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'Ubah threshold manager menjadi 1 juta',
            'Naikkan batas director ke 10 juta',
            'Kurangi SLA CEO menjadi 48 jam',
            'Aktifkan self approval',
            'Matikan auto escalate',
            'Tambah level 4 untuk CFO di atas 50 juta'
          ].map((example, idx) => (
            <button
              key={idx}
              onClick={() => setInput(example)}
              className="text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm text-gray-700 hover:text-blue-700 border hover:border-blue-200 transition-colors"
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
