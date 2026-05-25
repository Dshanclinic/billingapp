import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Printer } from 'lucide-react';

interface PendingResult {
  id: string;
  bill_id: string;
  service_name: string;
  room_type: string;
  status: string;
  result_json: Record<string, any>;
  diagnostic_bills: { bill_no: string; patients: { name: string; phone: string } | null } | null;
}

export default function RoomDashboard() {
  const { profile } = useAuth();
  const roomType = profile?.room_type || '';

  const [results, setResults] = useState<PendingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  async function loadResults() {
    setLoading(true);
    const { data } = await supabase
      .from('diagnostic_results')
      .select('*, diagnostic_bills(bill_no, patients(name, phone))')
      .eq('room_type', roomType)
      .order('created_at', { ascending: false });
    if (data) setResults(data as unknown as PendingResult[]);
    setLoading(false);
  }

  useEffect(() => { if (roomType) loadResults(); }, [roomType]);

  function openResult(r: PendingResult) {
    setActiveId(r.id);
    setFormData(r.status === 'completed' ? r.result_json : getDefaultForm());
  }

  function getDefaultForm(): Record<string, any> {
    switch (roomType) {
      case 'X-Ray':
        return { body_part: '', view: 'PA', findings: '', impression: '', radiologist_name: '', date: new Date().toISOString().slice(0, 10) };
      case 'Ultrasonography':
        return { examination_area: '', findings: '', impression: '', fetal_age: '', sonologist_name: '', date: new Date().toISOString().slice(0, 10) };
      case 'Pathology':
        return { tests: [{ test_name: '', result_value: '', unit: '', normal_range: '' }], remarks: '', pathologist_name: '', date: new Date().toISOString().slice(0, 10) };
      default:
        return { findings: '', impression: '', specialist_name: '', date: new Date().toISOString().slice(0, 10) };
    }
  }

  async function submitResult() {
    if (!activeId) return;
    setSubmitting(true);
    await supabase.from('diagnostic_results').update({
      result_json: formData,
      status: 'completed',
      delivered_by: profile?.id,
      delivered_at: new Date().toISOString(),
    }).eq('id', activeId);
    setActiveId(null);
    setSubmitting(false);
    await loadResults();
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

  const pending = results.filter((r) => r.status === 'pending');
  const completed = results.filter((r) => r.status === 'completed');

  function renderForm() {
    if (!activeId) return null;
    const result = results.find((r) => r.id === activeId);
    if (!result) return null;
    const isCompleted = result.status === 'completed';

    return (
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {result.service_name} - {result.diagnostic_bills?.patients?.name}
          </h2>
          <button onClick={() => setActiveId(null)} className="text-sm text-gray-500 hover:text-gray-700">বন্ধ করুন</button>
        </div>

        {roomType === 'X-Ray' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Body Part</label>
              <input className={inputClass} value={formData.body_part || ''} onChange={(e) => setFormData({ ...formData, body_part: e.target.value })} readOnly={isCompleted} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">View</label>
              <select className={inputClass} value={formData.view || 'PA'} onChange={(e) => setFormData({ ...formData, view: e.target.value })} disabled={isCompleted}>
                {['PA', 'AP', 'Lateral', 'Other'].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Findings</label>
              <textarea className={inputClass} rows={3} value={formData.findings || ''} onChange={(e) => setFormData({ ...formData, findings: e.target.value })} readOnly={isCompleted} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Impression</label>
              <textarea className={inputClass} rows={2} value={formData.impression || ''} onChange={(e) => setFormData({ ...formData, impression: e.target.value })} readOnly={isCompleted} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Radiologist Name</label>
              <input className={inputClass} value={formData.radiologist_name || ''} onChange={(e) => setFormData({ ...formData, radiologist_name: e.target.value })} readOnly={isCompleted} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" className={inputClass} value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} readOnly={isCompleted} />
            </div>
          </div>
        )}

        {roomType === 'Ultrasonography' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Examination Area</label>
              <input className={inputClass} value={formData.examination_area || ''} onChange={(e) => setFormData({ ...formData, examination_area: e.target.value })} readOnly={isCompleted} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fetal Age (optional)</label>
              <input className={inputClass} value={formData.fetal_age || ''} onChange={(e) => setFormData({ ...formData, fetal_age: e.target.value })} readOnly={isCompleted} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Findings</label>
              <textarea className={inputClass} rows={3} value={formData.findings || ''} onChange={(e) => setFormData({ ...formData, findings: e.target.value })} readOnly={isCompleted} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Impression</label>
              <textarea className={inputClass} rows={2} value={formData.impression || ''} onChange={(e) => setFormData({ ...formData, impression: e.target.value })} readOnly={isCompleted} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sonologist Name</label>
              <input className={inputClass} value={formData.sonologist_name || ''} onChange={(e) => setFormData({ ...formData, sonologist_name: e.target.value })} readOnly={isCompleted} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" className={inputClass} value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} readOnly={isCompleted} />
            </div>
          </div>
        )}

        {roomType === 'Pathology' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {(formData.tests || []).map((t: any, i: number) => (
                <div key={i} className="grid grid-cols-4 gap-2">
                  <input className={inputClass} placeholder="Test Name" value={t.test_name} onChange={(e) => {
                    const tests = [...formData.tests]; tests[i] = { ...t, test_name: e.target.value }; setFormData({ ...formData, tests });
                  }} readOnly={isCompleted} />
                  <input className={inputClass} placeholder="Result" value={t.result_value} onChange={(e) => {
                    const tests = [...formData.tests]; tests[i] = { ...t, result_value: e.target.value }; setFormData({ ...formData, tests });
                  }} readOnly={isCompleted} />
                  <input className={inputClass} placeholder="Unit" value={t.unit} onChange={(e) => {
                    const tests = [...formData.tests]; tests[i] = { ...t, unit: e.target.value }; setFormData({ ...formData, tests });
                  }} readOnly={isCompleted} />
                  <input className={inputClass} placeholder="Normal Range" value={t.normal_range} onChange={(e) => {
                    const tests = [...formData.tests]; tests[i] = { ...t, normal_range: e.target.value }; setFormData({ ...formData, tests });
                  }} readOnly={isCompleted} />
                </div>
              ))}
              {!isCompleted && (
                <button
                  onClick={() => setFormData({ ...formData, tests: [...(formData.tests || []), { test_name: '', result_value: '', unit: '', normal_range: '' }] })}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + সারি যোগ করুন
                </button>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Overall Remarks</label>
              <textarea className={inputClass} rows={2} value={formData.remarks || ''} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} readOnly={isCompleted} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pathologist Name</label>
                <input className={inputClass} value={formData.pathologist_name || ''} onChange={(e) => setFormData({ ...formData, pathologist_name: e.target.value })} readOnly={isCompleted} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="date" className={inputClass} value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} readOnly={isCompleted} />
              </div>
            </div>
          </div>
        )}

        {roomType === 'Other' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Findings</label>
              <textarea className={inputClass} rows={3} value={formData.findings || ''} onChange={(e) => setFormData({ ...formData, findings: e.target.value })} readOnly={isCompleted} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Impression</label>
              <textarea className={inputClass} rows={2} value={formData.impression || ''} onChange={(e) => setFormData({ ...formData, impression: e.target.value })} readOnly={isCompleted} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Specialist Name</label>
              <input className={inputClass} value={formData.specialist_name || ''} onChange={(e) => setFormData({ ...formData, specialist_name: e.target.value })} readOnly={isCompleted} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" className={inputClass} value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} readOnly={isCompleted} />
            </div>
          </div>
        )}

        {!isCompleted && (
          <button
            onClick={submitResult}
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg px-5 py-2.5 transition disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? 'অপেক্ষা করুন...' : 'রিজাল্ট সাবমিট করুন'}
          </button>
        )}

        {isCompleted && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg px-5 py-2.5 transition"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট করুন
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{roomType} - রিপোর্ট ড্যাশবোর্ড</h1>

      {activeId ? (
        renderForm()
      ) : (
        <>
          {/* Pending */}
          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">পেন্ডিং রিপোর্ট ({pending.length})</h2>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400">কোনো পেন্ডিং রিপোর্ট নেই</p>
            ) : (
              <div className="space-y-2">
                {pending.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openResult(r)}
                    className="w-full text-left p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{r.service_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{r.diagnostic_bills?.patients?.name}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">পেন্ডিং</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">বিল: {r.diagnostic_bills?.bill_no}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Completed */}
          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">সম্পন্ন রিপোর্ট ({completed.length})</h2>
            {completed.length === 0 ? (
              <p className="text-sm text-gray-400">কোনো সম্পন্ন রিপোর্ট নেই</p>
            ) : (
              <div className="space-y-2">
                {completed.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openResult(r)}
                    className="w-full text-left p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{r.service_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{r.diagnostic_bills?.patients?.name}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-200 text-green-800">সম্পন্ন</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">বিল: {r.diagnostic_bills?.bill_no}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
