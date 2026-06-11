import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Eye } from 'lucide-react';

interface Admission {
  id: string;
  patient_code: string;
  admission_date: string;
  contract_amount: number;
  status: string;
  patients: { name: string; phone: string } | null;
  doctors: { name: string } | null;
  beds: { cabin_number: string } | null;
}

export default function IPDList() {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'admitted' | 'released' | 'all'>('admitted');

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from('ipd_admissions')
        .select('id, patient_code, admission_date, contract_amount, status, patients(name, phone), doctors(name), beds:cabin_id(cabin_number)')
        .order('admission_date', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      setAdmissions((data as unknown as Admission[]) || []);
      setLoading(false);
    }
    load();
  }, [filter]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/hospital-billing')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </button>
        <h1 className="text-xl font-bold text-gray-800">ভর্তি রোগীর তালিকা</h1>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([['admitted', 'ভর্তি'], ['released', 'ছাড়প্রাপ্ত'], ['all', 'সব']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filter === key ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">পেশেন্ট আইডি</th>
                <th className="text-left px-4 py-3 font-medium">রোগীর নাম</th>
                <th className="text-left px-4 py-3 font-medium">ফোন</th>
                <th className="text-left px-4 py-3 font-medium">ডাক্তার</th>
                <th className="text-left px-4 py-3 font-medium">কেবিন</th>
                <th className="text-left px-4 py-3 font-medium">ভর্তি তারিখ</th>
                <th className="text-right px-4 py-3 font-medium">চুক্তি</th>
                <th className="text-left px-4 py-3 font-medium">অবস্থা</th>
                <th className="text-center px-4 py-3 font-medium">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">লোড হচ্ছে...</td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">কোনো রোগী পাওয়া যায়নি</td>
                </tr>
              ) : (
                admissions.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{a.patient_code}</td>
                    <td className="px-4 py-3">{a.patients?.name ?? '—'}</td>
                    <td className="px-4 py-3">{a.patients?.phone ?? '—'}</td>
                    <td className="px-4 py-3">{a.doctors?.name ?? '—'}</td>
                    <td className="px-4 py-3">{a.beds?.cabin_number ?? '—'}</td>
                    <td className="px-4 py-3">{new Date(a.admission_date).toLocaleDateString('bn-BD')}</td>
                    <td className="px-4 py-3 text-right font-semibold">৳{a.contract_amount.toLocaleString('bn-BD')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.status === 'admitted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {a.status === 'admitted' ? 'ভর্তি' : 'ছাড়প্রাপ্ত'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/ipd/${a.id}`)}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 text-xs"
                      >
                        <Eye size={15} /> দেখুন
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
