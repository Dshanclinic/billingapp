import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Printer, ArrowLeft } from 'lucide-react';

interface Admission {
  id: string;
  patient_code: string;
  admission_date: string;
  release_date: string | null;
  contract_amount: number;
  status: string;
  final_payment_method: string | null;
  patients: { name: string; age: string; phone: string; address: string } | null;
  doctors: { name: string } | null;
  beds: { cabin_number: string; cabin_types: { type_name: string; daily_charge: number } | null } | null;
}

interface Advance {
  id: string;
  amount: number;
  payment_method: string;
  created_at: string;
}

interface IPDService {
  id: string;
  service_name: string;
  quantity: number;
  price: number;
}

export default function IPDPrintPreview() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const navigate = useNavigate();

  const [admission, setAdmission] = useState<Admission | null>(null);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [services, setServices] = useState<IPDService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const load = async () => {
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
    };
    load();
  }, [admissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!admission || !admission.patients) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500">তথ্য খুঁজে পাওয়া যায়নি</p>
        <button onClick={() => navigate(-1)} className="text-primary-600 underline">ফিরে যান</button>
      </div>
    );
  }

  const patient = admission.patients;
  const totalAdvance = advances.reduce((s, a) => s + a.amount, 0);
  const totalServices = services.reduce((s, sv) => s + sv.quantity * sv.price, 0);
  const remaining = admission.contract_amount - totalAdvance;
  const copyLabels = ['Office Copy', 'Patient Copy'];

  const BillCopy = ({ label, isLast }: { label: string; isLast: boolean }) => (
    <div
      className="max-w-[210mm] mx-auto bg-white border border-gray-200 p-8 text-sm relative"
      style={{ pageBreakAfter: isLast ? 'auto' : 'always' }}
    >
      {/* Copy label */}
      <div className="absolute top-4 right-4 text-xs font-semibold text-gray-500 border border-gray-300 px-2 py-1 rounded">
        {label}
      </div>

      {/* Clinic header */}
      <div className="text-center mb-6">
        <img
          src="/showpno.png.png"
          alt="স্বপ্ন ক্লিনিক এন্ড ডায়াগনস্টিক সেন্টার"
          className="h-16 w-auto mx-auto object-contain"
        />
        <p className="text-xs text-gray-500 mt-1 font-semibold">ভর্তি রোগীর ফাইনাল বিল</p>
      </div>

      {/* Patient info */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-4 text-xs">
        <p><span className="font-semibold">রোগীর নাম:</span> {patient.name}</p>
        <p><span className="font-semibold">বয়স:</span> {patient.age || '—'}</p>
        <p><span className="font-semibold">ফোন:</span> {patient.phone}</p>
        <p><span className="font-semibold">ঠিকানা:</span> {patient.address || '—'}</p>
        <p><span className="font-semibold">পেশেন্ট আইডি:</span> {admission.patient_code}</p>
        <p><span className="font-semibold">ডাক্তার:</span> {admission.doctors?.name ?? '—'}</p>
        <p><span className="font-semibold">কেবিন:</span> {admission.beds?.cabin_number ?? '—'} ({admission.beds?.cabin_types?.type_name ?? ''})</p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-x-6 mb-5 text-xs">
        <p><span className="font-semibold">ভর্তি তারিখ:</span> {new Date(admission.admission_date).toLocaleDateString('bn-BD')}</p>
        {admission.release_date && (
          <p><span className="font-semibold">ছাড়ের তারিখ:</span> {new Date(admission.release_date).toLocaleDateString('bn-BD')}</p>
        )}
      </div>

      {/* Services table */}
      {services.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold mb-2 text-gray-700">সেবা সমূহ:</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-1.5 font-semibold">সেবার নাম</th>
                <th className="text-center py-1.5 font-semibold w-16">পরিমাণ</th>
                <th className="text-right py-1.5 font-semibold w-24">মূল্য</th>
                <th className="text-right py-1.5 font-semibold w-24">মোট</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-gray-200">
                  <td className="py-1.5">{s.service_name}</td>
                  <td className="py-1.5 text-center">{s.quantity}</td>
                  <td className="py-1.5 text-right">৳{s.price.toLocaleString('en-IN')}</td>
                  <td className="py-1.5 text-right">৳{(s.quantity * s.price).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-400">
                <td colSpan={3} className="py-1.5 text-right font-semibold">সর্বমোট সেবা:</td>
                <td className="py-1.5 text-right font-bold">৳{totalServices.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Contract amount */}
      <div className="border-t border-b border-gray-300 py-3 mb-4">
        <div className="flex justify-between text-xs font-semibold">
          <span>চুক্তির পরিমাণ (Grand Total)</span>
          <span className="text-base font-bold">৳{admission.contract_amount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Advance payments table */}
      {advances.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2 text-gray-700">অগ্রিম পেমেন্ট:</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1.5 font-semibold">তারিখ</th>
                <th className="text-right py-1.5 font-semibold">পরিমাণ</th>
                <th className="text-left py-1.5 font-semibold pl-4">মেথড</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((a) => (
                <tr key={a.id} className="border-b border-gray-100">
                  <td className="py-1.5">{new Date(a.created_at).toLocaleDateString('bn-BD')}</td>
                  <td className="py-1.5 text-right">৳{a.amount.toLocaleString('en-IN')}</td>
                  <td className="py-1.5 pl-4">{a.payment_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment summary */}
      <div className="flex justify-end mb-6">
        <div className="w-72 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span>চুক্তির পরিমাণ</span>
            <span>৳{admission.contract_amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-green-700">
            <span>মোট অগ্রিম</span>
            <span>- ৳{totalAdvance.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-gray-800 pt-1.5">
            <span>বাকি পরিমাণ (ফাইনাল পেমেন্ট)</span>
            <span className={remaining > 0 ? 'text-red-600' : ''}>৳{Math.max(0, remaining).toLocaleString('en-IN')}</span>
          </div>
          {admission.final_payment_method && remaining > 0 && (
            <div className="flex justify-between text-gray-600 pt-0.5">
              <span>ফাইনাল পেমেন্ট মেথড</span>
              <span>{admission.final_payment_method}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signature */}
      <div className="flex justify-between mt-12 pt-2 text-xs">
        <div className="text-center">
          <div className="border-t border-gray-400 w-36 mb-1" />
          <span>রোগী / প্রতিনিধির স্বাক্ষর</span>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 w-36 mb-1" />
          <span>কর্তৃপক্ষের স্বাক্ষর</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { margin: 0; padding: 0; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print max-w-4xl mx-auto mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" /> ফিরে যান
            </button>
            <div className="h-5 w-px bg-gray-300" />
            {copyLabels.map((label, idx) => (
              <button
                key={label}
                onClick={() => setActiveTab(idx)}
                className={`text-sm px-3 py-1.5 rounded-lg transition ${
                  activeTab === idx
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
          >
            <Printer className="h-4 w-4" /> সব কপি প্রিন্ট করুন
          </button>
        </div>
      </div>

      {/* Screen: show only active tab */}
      <div className="no-print">
        <BillCopy label={copyLabels[activeTab]} isLast />
      </div>

      {/* Print: show all copies with page breaks */}
      <div className="print-only">
        {copyLabels.map((label, idx) => (
          <BillCopy key={label} label={label} isLast={idx === copyLabels.length - 1} />
        ))}
      </div>
    </>
  );
}
