import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Printer, ArrowLeft } from 'lucide-react';

interface ServiceItem {
  name: string;
  qty: number;
  price: number;
  extra_copies: { copy_name: string }[];
}

interface Bill {
  id: string;
  bill_no: string;
  patient_id: string;
  doctor_id?: string | null;
  bed_id?: string | null;
  referred_by?: string | null;
  ref_no: string | null;
  bill_date: string;
  bill_time?: string;
  services_json: ServiceItem[];
  subtotal: number;
  discount: number;
  grand_total: number;
  payment_method: string;
  due_amount: number;
}

interface Patient {
  name: string;
  age: string;
  phone: string;
  address: string;
}

export default function PrintPreview() {
  const { type, billId } = useParams<{ type: string; billId: string }>();
  const navigate = useNavigate();

  const [bill, setBill] = useState<Bill | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [receptionistName, setReceptionistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const isHospital = type === 'hospital';
  const tableName = isHospital ? 'hospital_bills' : 'diagnostic_bills';

  useEffect(() => {
    const load = async () => {
      if (!billId) return;

      const { data: billData, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', billId)
        .single();

      if (error || !billData) {
        setLoading(false);
        return;
      }

      setBill(billData);

      const { data: patientData } = await supabase
        .from('patients')
        .select('name, age, phone, address')
        .eq('id', billData.patient_id)
        .single();

      if (patientData) setPatient(patientData);

      if (isHospital) {
        if (billData.doctor_id) {
          const { data: doc } = await supabase
            .from('doctors')
            .select('name')
            .eq('id', billData.doctor_id)
            .single();
          if (doc) setDoctorName(doc.name);
        }
        if (billData.bed_id) {
          const { data: bed } = await supabase
            .from('beds')
            .select('cabin_number')
            .eq('id', billData.bed_id)
            .single();
          if (bed) setBedNumber(bed.cabin_number);
        }
      }

      if (billData.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', billData.created_by)
          .maybeSingle();
        if (profile) setReceptionistName(profile.full_name);
      }

      setLoading(false);
    };
    load();
  }, [billId, tableName, isHospital]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!bill || !patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500">বিল খুঁজে পাওয়া যায়নি</p>
        <button onClick={() => navigate(-1)} className="text-primary-600 underline">
          ফিরে যান
        </button>
      </div>
    );
  }

  // Build copy labels: Office Copy + Patient Copy + unique extra copies
  const extraCopyNames = new Set<string>();
  for (const svc of bill.services_json) {
    if (svc.extra_copies) {
      for (const ec of svc.extra_copies) {
        if (ec.copy_name) extraCopyNames.add(ec.copy_name);
      }
    }
  }
  const copyLabels = ['Office Copy', 'Patient Copy', ...Array.from(extraCopyNames)];

  const BillCopy = ({ label, isLast }: { label: string; isLast: boolean }) => (
    <div
      className="max-w-[210mm] mx-auto bg-white border border-gray-200 p-8 text-sm relative"
      style={{ pageBreakAfter: isLast ? 'auto' : 'always' }}
    >
      {/* Copy label - top right */}
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
      </div>

      {/* Patient info */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4 text-xs">
        <p><span className="font-semibold">রোগীর নাম:</span> {patient.name}</p>
        <p><span className="font-semibold">বয়স:</span> {patient.age || '—'}</p>
        <p><span className="font-semibold">ফোন:</span> {patient.phone}</p>
        <p><span className="font-semibold">ঠিকানা:</span> {patient.address || '—'}</p>
      </div>

      {/* Doctor / Bed or Referred By */}
      {isHospital ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4 text-xs">
          {doctorName && <p><span className="font-semibold">ডাক্তার:</span> {doctorName}</p>}
          {bedNumber && <p><span className="font-semibold">কেবিন নম্বর:</span> {bedNumber}</p>}
        </div>
      ) : (
        bill.referred_by && (
          <div className="mb-4 text-xs">
            <p><span className="font-semibold">রেফার্ড বাই:</span> {bill.referred_by}</p>
          </div>
        )
      )}

      {/* Bill meta */}
      <div className="grid grid-cols-3 gap-x-4 mb-5 text-xs">
        <p><span className="font-semibold">বিল নং:</span> {bill.bill_no}</p>
        <p><span className="font-semibold">তারিখ:</span> {bill.bill_date}</p>
        {bill.ref_no && <p><span className="font-semibold">রেফ নং:</span> {bill.ref_no}</p>}
      </div>

      {/* Services table */}
      <table className="w-full border-collapse mb-5 text-xs">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2 font-semibold">সেবার নাম</th>
            <th className="text-center py-2 font-semibold w-16">পরিমাণ</th>
            <th className="text-right py-2 font-semibold w-24">মূল্য</th>
            <th className="text-right py-2 font-semibold w-24">মোট</th>
          </tr>
        </thead>
        <tbody>
          {bill.services_json.map((svc, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-1.5">{svc.name}</td>
              <td className="py-1.5 text-center">{svc.qty}</td>
              <td className="py-1.5 text-right">৳ {svc.price.toLocaleString('en-IN')}</td>
              <td className="py-1.5 text-right">৳ {(svc.qty * svc.price).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-5">
        <div className="w-60 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>সাবটোটাল</span>
            <span>৳ {bill.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span>ছাড়</span>
            <span>- ৳ {bill.discount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-gray-800 pt-1">
            <span>সর্বমোট</span>
            <span>৳ {bill.grand_total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="text-xs mb-8 space-y-1">
        <p><span className="font-semibold">পেমেন্ট:</span> {bill.payment_method}</p>
        {bill.due_amount > 0 && (
          <p><span className="font-semibold text-red-600">বকেয়া:</span> ৳ {bill.due_amount.toLocaleString('en-IN')}</p>
        )}
        {receptionistName && (
          <p><span className="font-semibold">বিল তৈরিকারী:</span> {receptionistName}</p>
        )}
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
      {/* Print styles */}
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
