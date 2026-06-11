import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Printer } from 'lucide-react';

interface Admission {
  id: string;
  patient_code: string;
  patient_id: string;
  admission_date: string;
  release_date: string | null;
  contract_amount: number;
  status: string;
  cabin_id: string | null;
  patients: { name: string; age: string; phone: string; address: string } | null;
  doctors: { name: string } | null;
  beds: { cabin_number: string; cabin_types: { type_name: string; daily_charge: number } | null } | null;
}

interface Advance {
  id: string;
  amount: number;
  payment_method: string;
  note: string;
  created_at: string;
}

interface IPDService {
  id: string;
  service_name: string;
  quantity: number;
  price: number;
  added_at: string;
}

export default function IPDAccount() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [admission, setAdmission] = useState<Admission | null>(null);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [services, setServices] = useState<IPDService[]>([]);
  const [loading, setLoading] = useState(true);

  // Advance form
  const [advAmount, setAdvAmount] = useState(0);
  const [advMethod, setAdvMethod] = useState('Cash');
  const [advSubmitting, setAdvSubmitting] = useState(false);

  // Service form
  const [svcName, setSvcName] = useState('');
  const [svcQty, setSvcQty] = useState(1);
  const [svcPrice, setSvcPrice] = useState(0);
  const [svcSubmitting, setSvcSubmitting] = useState(false);

  // Release
  const [releasing, setReleasing] = useState(false);
  const [finalPayMethod, setFinalPayMethod] = useState('Cash');
  const [showRelease, setShowRelease] = useState(false);

  async function loadData() {
    if (!admissionId) return;

    const [admRes, advRes, svcRes] = await Promise.all([
      supabase
        .from('ipd_admissions')
        .select('*, patients(name, age, phone, address), doctors(name), beds:cabin_id(cabin_number, cabin_types(type_name, daily_charge))')
        .eq('id', admissionId)
        .single(),
      supabase
        .from('ipd_advances')
        .select('*')
        .eq('admission_id', admissionId)
        .order('created_at'),
      supabase
        .from('ipd_services')
        .select('*')
        .eq('admission_id', admissionId)
        .order('added_at'),
    ]);

    if (admRes.data) setAdmission(admRes.data as unknown as Admission);
    if (advRes.data) setAdvances(advRes.data);
    if (svcRes.data) setServices(svcRes.data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [admissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500">ভর্তি তথ্য খুঁজে পাওয়া যায়নি</p>
        <button onClick={() => navigate('/ipd')} className="text-primary-600 underline">ফিরে যান</button>
      </div>
    );
  }

  const totalAdvance = advances.reduce((s, a) => s + a.amount, 0);
  const totalServices = services.reduce((s, sv) => s + sv.quantity * sv.price, 0);
  const remaining = admission.contract_amount - totalAdvance;

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

  async function addAdvance() {
    if (advAmount <= 0) return;
    setAdvSubmitting(true);
    await supabase.from('ipd_advances').insert({
      admission_id: admissionId,
      amount: advAmount,
      payment_method: advMethod,
      note: '',
      created_by: profile?.id ?? null,
    });
    setAdvAmount(0);
    setAdvSubmitting(false);
    await loadData();
  }

  async function addService() {
    if (!svcName || svcPrice <= 0) return;
    setSvcSubmitting(true);
    await supabase.from('ipd_services').insert({
      admission_id: admissionId,
      service_name: svcName,
      quantity: svcQty,
      price: svcPrice,
      added_by: profile?.id ?? null,
    });
    setSvcName('');
    setSvcQty(1);
    setSvcPrice(0);
    setSvcSubmitting(false);
    await loadData();
  }

  async function handleRelease() {
    if (!admission) return;
    setReleasing(true);
    try {
      await supabase.from('ipd_admissions').update({
        status: 'released',
        release_date: new Date().toISOString(),
        final_payment_method: remaining > 0 ? finalPayMethod : null,
      }).eq('id', admissionId);

      if (admission.cabin_id) {
        await supabase.from('beds').update({ status: 'Available' }).eq('id', admission.cabin_id);
      }

      navigate(`/ipd/print/${admissionId}`);
    } finally {
      setReleasing(false);
    }
  }

  const isAdmitted = admission.status === 'admitted';

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/ipd')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </button>
        <h1 className="text-xl font-bold text-gray-800">ভর্তি রোগীর হিসাব</h1>
      </div>

      {/* Patient info card */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-500">পেশেন্ট আইডি</span>
            <p className="font-semibold">{admission.patient_code}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">নাম</span>
            <p className="font-semibold">{admission.patients?.name}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">ফোন</span>
            <p className="font-semibold">{admission.patients?.phone}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">বয়স</span>
            <p className="font-semibold">{admission.patients?.age || '—'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">ডাক্তার</span>
            <p className="font-semibold">{admission.doctors?.name ?? '—'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">কেবিন</span>
            <p className="font-semibold">{admission.beds?.cabin_number ?? '—'} ({admission.beds?.cabin_types?.type_name ?? ''})</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">ভর্তি তারিখ</span>
            <p className="font-semibold">{new Date(admission.admission_date).toLocaleDateString('bn-BD')}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">অবস্থা</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              isAdmitted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {isAdmitted ? 'ভর্তি' : 'ছাড়প্রাপ্ত'}
            </span>
          </div>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-blue-600">চুক্তির পরিমাণ</p>
          <p className="text-xl font-bold text-blue-800">৳{admission.contract_amount.toLocaleString('bn-BD')}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-green-600">মোট অগ্রিম</p>
          <p className="text-xl font-bold text-green-800">৳{totalAdvance.toLocaleString('bn-BD')}</p>
        </div>
        <div className={`rounded-xl p-4 shadow-sm ${remaining > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
          <p className={`text-xs ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>বাকি</p>
          <p className={`text-xl font-bold ${remaining > 0 ? 'text-amber-800' : 'text-green-800'}`}>৳{remaining.toLocaleString('bn-BD')}</p>
        </div>
      </div>

      {/* Advance payments */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">অগ্রিম পেমেন্ট</h2>

        {isAdmitted && (
          <div className="flex flex-wrap items-end gap-3 bg-gray-50 rounded-lg p-3">
            <div className="w-32">
              <label className="block text-xs text-gray-500 mb-1">পরিমাণ (৳)</label>
              <input type="number" min={0} value={advAmount || ''} onChange={(e) => setAdvAmount(+e.target.value)} className={inputClass} />
            </div>
            <div className="w-40">
              <label className="block text-xs text-gray-500 mb-1">পেমেন্ট মেথড</label>
              <select value={advMethod} onChange={(e) => setAdvMethod(e.target.value)} className={inputClass}>
                <option value="Cash">Cash</option>
                <option value="bKash/Nagad">bKash/Nagad</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <button onClick={addAdvance} disabled={advSubmitting} className="inline-flex items-center gap-1 bg-primary-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition disabled:opacity-50">
              <Plus className="w-4 h-4" /> অগ্রিম যোগ করুন
            </button>
          </div>
        )}

        {advances.length === 0 ? (
          <p className="text-sm text-gray-400">এখনো কোনো অগ্রিম দেওয়া হয়নি</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">তারিখ</th>
                  <th className="pb-2 font-medium text-right">পরিমাণ</th>
                  <th className="pb-2 font-medium">মেথড</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-2">{new Date(a.created_at).toLocaleDateString('bn-BD')}</td>
                    <td className="py-2 text-right font-semibold">৳{a.amount.toLocaleString('bn-BD')}</td>
                    <td className="py-2">{a.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Services during stay */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">সেবা সমূহ</h2>

        {isAdmitted && (
          <div className="flex flex-wrap items-end gap-3 bg-gray-50 rounded-lg p-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">সেবার নাম</label>
              <input value={svcName} onChange={(e) => setSvcName(e.target.value)} className={inputClass} />
            </div>
            <div className="w-20">
              <label className="block text-xs text-gray-500 mb-1">পরিমাণ</label>
              <input type="number" min={1} value={svcQty} onChange={(e) => setSvcQty(Math.max(1, +e.target.value))} className={inputClass} />
            </div>
            <div className="w-28">
              <label className="block text-xs text-gray-500 mb-1">মূল্য (৳)</label>
              <input type="number" min={0} value={svcPrice || ''} onChange={(e) => setSvcPrice(+e.target.value)} className={inputClass} />
            </div>
            <button onClick={addService} disabled={svcSubmitting} className="inline-flex items-center gap-1 bg-primary-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition disabled:opacity-50">
              <Plus className="w-4 h-4" /> যোগ করুন
            </button>
          </div>
        )}

        {services.length === 0 ? (
          <p className="text-sm text-gray-400">এখনো কোনো সেবা যোগ হয়নি</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">সেবা</th>
                  <th className="pb-2 font-medium text-center">পরিমাণ</th>
                  <th className="pb-2 font-medium text-right">মূল্য</th>
                  <th className="pb-2 font-medium text-right">মোট</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="py-2">{s.service_name}</td>
                    <td className="py-2 text-center">{s.quantity}</td>
                    <td className="py-2 text-right">৳{s.price.toLocaleString('bn-BD')}</td>
                    <td className="py-2 text-right font-semibold">৳{(s.quantity * s.price).toLocaleString('bn-BD')}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={3} className="py-2 text-right font-semibold">সর্বমোট সেবা:</td>
                  <td className="py-2 text-right font-bold">৳{totalServices.toLocaleString('bn-BD')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Release section */}
      {isAdmitted && (
        <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
          {!showRelease ? (
            <button
              onClick={() => setShowRelease(true)}
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-5 py-2.5 transition"
            >
              রিলিজ ও ফাইনাল বিল
            </button>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">ফাইনাল বিল (রিলিজ)</h2>

              <div className="border rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>চুক্তির পরিমাণ</span><span className="font-semibold">৳{admission.contract_amount.toLocaleString('bn-BD')}</span></div>
                <div className="flex justify-between"><span>মোট অগ্রিম দেওয়া হয়েছে</span><span className="font-semibold text-green-700">- ৳{totalAdvance.toLocaleString('bn-BD')}</span></div>
                <div className="flex justify-between border-t pt-2 font-bold text-base">
                  <span>বাকি পরিমাণ</span>
                  <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                    ৳{remaining.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              {remaining > 0 && (
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ফাইনাল পেমেন্ট মেথড</label>
                  <select value={finalPayMethod} onChange={(e) => setFinalPayMethod(e.target.value)} className={inputClass}>
                    <option value="Cash">Cash</option>
                    <option value="bKash/Nagad">bKash/Nagad</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleRelease}
                  disabled={releasing}
                  className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg px-5 py-2.5 transition disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  {releasing ? 'অপেক্ষা করুন...' : 'রিলিজ ও প্রিন্ট'}
                </button>
                <button
                  onClick={() => setShowRelease(false)}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  বাতিল
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Released info */}
      {!isAdmitted && admission.release_date && (
        <div className="bg-gray-50 rounded-xl border p-5 flex items-center justify-between">
          <p className="text-sm text-gray-600">ছাড়ের তারিখ: <span className="font-semibold">{new Date(admission.release_date).toLocaleDateString('bn-BD')}</span></p>
          <button
            onClick={() => navigate(`/ipd/print/${admissionId}`)}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
          >
            <Printer className="w-4 h-4" /> ফাইনাল বিল প্রিন্ট করুন
          </button>
        </div>
      )}
    </div>
  );
}
