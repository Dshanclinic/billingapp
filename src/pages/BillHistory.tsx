import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, Printer, ArrowLeft } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Bill {
  id: string;
  bill_no: string;
  created_at: string;
  grand_total: number;
  payment_method: string;
  patients: { name: string; phone: string } | null;
  profiles: { full_name: string } | null;
}

const paymentOptions = ['সব', 'Cash', 'bKash/Nagad', 'Card', 'Due'];

export default function BillHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const billType = searchParams.get('type') === 'diagnostic' ? 'diagnostic' : 'hospital';

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('সব');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const table = billType === 'hospital' ? 'hospital_bills' : 'diagnostic_bills';
      const { data } = await supabase
        .from(table)
        .select('id, bill_no, created_at, grand_total, payment_method, patients(name, phone), profiles:created_by(full_name)')
        .order('created_at', { ascending: false });
      setBills((data as unknown as Bill[]) || []);
      setLoading(false);
    }
    load();
  }, [billType]);

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      if (dateFrom && b.created_at < dateFrom) return false;
      if (dateTo && b.created_at > dateTo + 'T23:59:59') return false;
      if (paymentMethod !== 'সব' && b.payment_method !== paymentMethod)
        return false;
      return true;
    });
  }, [bills, dateFrom, dateTo, paymentMethod]);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const todayBills = filtered.filter(
    (b) => b.created_at.slice(0, 10) === today,
  );
  const todayCount = todayBills.length;
  const todayIncome = todayBills.reduce((s, b) => s + (b.grand_total || 0), 0);
  const monthIncome = filtered
    .filter((b) => b.created_at.slice(0, 7) === currentMonth)
    .reduce((s, b) => s + (b.grand_total || 0), 0);

  const chartData = useMemo(() => {
    const map: Record<number, number> = {};
    filtered
      .filter((b) => b.created_at.slice(0, 7) === currentMonth)
      .forEach((b) => {
        const day = new Date(b.created_at).getDate();
        map[day] = (map[day] || 0) + (b.grand_total || 0);
      });
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      total: map[i + 1] || 0,
    }));
  }, [filtered, currentMonth]);

  const fmt = (n: number) => n.toLocaleString('bn-BD');
  const printRoute = (id: string) =>
    billType === 'hospital'
      ? `/print/hospital/${id}`
      : `/print/diagnostic/${id}`;

  const backRoute = billType === 'hospital' ? '/hospital-billing' : '/diagnostic-billing';
  const title = billType === 'hospital' ? 'হাসপাতাল বিল ইতিহাস' : 'ডায়াগনস্টিক বিল ইতিহাস';

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(backRoute)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </button>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-blue-600">আজকের বিল সংখ্যা</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">
            {fmt(todayCount)}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-green-600">আজকের মোট আয়</p>
          <p className="text-2xl font-bold text-green-800 mt-1">
            ৳{fmt(todayIncome)}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-amber-600">এই মাসের মোট আয়</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            ৳{fmt(monthIncome)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 bg-white rounded-xl p-4 shadow-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">তারিখ থেকে</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">তারিখ পর্যন্ত</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">পেমেন্ট মেথড</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 outline-none"
          >
            {paymentOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">বিল নং</th>
                <th className="text-left px-4 py-3 font-medium">রোগীর নাম</th>
                <th className="text-left px-4 py-3 font-medium">ফোন</th>
                <th className="text-left px-4 py-3 font-medium">তারিখ</th>
                <th className="text-right px-4 py-3 font-medium">মোট টাকা</th>
                <th className="text-left px-4 py-3 font-medium">পেমেন্ট</th>
                <th className="text-left px-4 py-3 font-medium">রিসেপশনিস্ট</th>
                <th className="text-center px-4 py-3 font-medium">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    কোনো বিল পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {b.bill_no}
                    </td>
                    <td className="px-4 py-3">{b.patients?.name ?? '—'}</td>
                    <td className="px-4 py-3">{b.patients?.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      {new Date(b.created_at).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ৳{fmt(b.grand_total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                        {b.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {b.profiles?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => navigate(printRoute(b.id))}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 text-xs"
                        title="দেখুন"
                      >
                        <Eye size={15} /> দেখুন
                      </button>
                      <button
                        onClick={() => {
                          navigate(printRoute(b.id));
                          setTimeout(() => window.print(), 600);
                        }}
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs"
                        title="প্রিন্ট"
                      >
                        <Printer size={15} /> প্রিন্ট
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          এই মাসের দৈনিক আয়
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [`৳${fmt(Number(value))}`, 'আয়']}
              labelFormatter={(label) => `দিন ${label}`}
            />
            <Bar dataKey="total" fill="#185FA5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
