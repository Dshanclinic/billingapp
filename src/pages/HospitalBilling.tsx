import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Printer, FileText } from 'lucide-react';
import PatientSearch from '../components/PatientSearch';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ServiceRow {
  serviceId: string;
  serviceName: string;
  qty: number;
  price: number;
  extraCopies: { copy_name: string }[];
}

interface Doctor { id: string; name: string }
interface CabinOption { id: string; cabin_number: string; cabin_type_id: string | null; status: string; cabin_types: { type_name: string; daily_charge: number } | null }
interface ServiceOption {
  id: string;
  name: string;
  default_price: number;
  extra_copies_json: { copy_name: string }[] | null;
}

const emptyRow = (): ServiceRow => ({
  serviceId: '',
  serviceName: '',
  qty: 1,
  price: 0,
  extraCopies: [],
});

type BillingMode = 'opd' | 'ipd';

export default function HospitalBilling() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [mode, setMode] = useState<BillingMode>('opd');

  // === Shared data ===
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [cabins, setCabins] = useState<CabinOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  useEffect(() => {
    const load = async () => {
      const [dRes, cRes, sRes] = await Promise.all([
        supabase.from('doctors').select('id, name'),
        supabase.from('beds').select('id, cabin_number, cabin_type_id, status, cabin_types(type_name, daily_charge)'),
        supabase.from('hospital_services').select('id, name, default_price, extra_copies_json'),
      ]);
      if (dRes.data) setDoctors(dRes.data);
      if (cRes.data) setCabins(cRes.data as unknown as CabinOption[]);
      if (sRes.data) setServices(sRes.data);
    };
    load();
  }, []);

  const availableCabins = cabins.filter((c) => c.status === 'Available');

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">হাসপাতাল বিলিং</h1>
        <button
          onClick={() => navigate('/history?type=hospital')}
          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <FileText className="w-4 h-4" /> বিল ইতিহাস
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setMode('opd')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition ${
            mode === 'opd' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          বহির্বিভাগ বিল (OPD)
        </button>
        <button
          onClick={() => setMode('ipd')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition ${
            mode === 'ipd' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          ভর্তি রোগী (IPD)
        </button>
      </div>

      {mode === 'opd' ? (
        <OPDForm
          doctors={doctors}
          cabins={availableCabins}
          services={services}
          profile={profile}
          inputClass={inputClass}
          navigate={navigate}
        />
      ) : (
        <IPDAdmission
          doctors={doctors}
          cabins={availableCabins}
          profile={profile}
          inputClass={inputClass}
          navigate={navigate}
        />
      )}
    </div>
  );
}

// === OPD Form (existing flow) ===
function OPDForm({
  doctors,
  cabins,
  services,
  profile,
  inputClass,
  navigate,
}: {
  doctors: Doctor[];
  cabins: CabinOption[];
  services: ServiceOption[];
  profile: any;
  inputClass: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [patientData, setPatientData] = useState({
    name: '', age: '', phone: '', address: '', id: null as string | null,
  });

  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedBed, setSelectedBed] = useState('');
  const [refNo, setRefNo] = useState('');
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([emptyRow()]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [dueAmount, setDueAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('');

  const currentDate = new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const updateRow = (idx: number, patch: Partial<ServiceRow>) => {
    setServiceRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleServiceSelect = (idx: number, serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    updateRow(idx, {
      serviceId: svc.id,
      serviceName: svc.name,
      price: svc.default_price,
      extraCopies: svc.extra_copies_json ?? [],
    });
  };

  const removeRow = (idx: number) => {
    setServiceRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, i) => i !== idx)));
  };

  const subtotal = serviceRows.reduce((s, r) => s + r.qty * r.price, 0);
  const grandTotal = Math.max(subtotal - discount, 0);

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceFilter.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (!patientData.name || !patientData.phone) {
      alert('রোগীর নাম ও ফোন নম্বর দিন');
      return;
    }
    if (!serviceRows.some((r) => r.serviceId)) {
      alert('অন্তত একটি সেবা যোগ করুন');
      return;
    }

    setSubmitting(true);
    try {
      let patientId = patientData.id;

      if (!patientId) {
        const { data, error } = await supabase
          .from('patients')
          .insert({ name: patientData.name, age: patientData.age, phone: patientData.phone, address: patientData.address })
          .select('id')
          .single();
        if (error) throw error;
        patientId = data.id;
      }

      const billNo = 'HB-' + Date.now();
      const servicesJson = serviceRows
        .filter((r) => r.serviceId)
        .map((r) => ({
          name: r.serviceName,
          qty: r.qty,
          price: r.price,
          extra_copies: r.extraCopies,
        }));

      const { data: bill, error: billErr } = await supabase
        .from('hospital_bills')
        .insert({
          bill_no: billNo,
          patient_id: patientId,
          doctor_id: selectedDoctor || null,
          bed_id: selectedBed || null,
          ref_no: refNo || null,
          bill_date: currentDate,
          bill_time: currentTime,
          services_json: servicesJson,
          subtotal,
          discount,
          grand_total: grandTotal,
          payment_method: paymentMethod,
          due_amount: paymentMethod === 'Due' ? dueAmount : 0,
          created_by: profile?.id ?? null,
        })
        .select('id')
        .single();

      if (billErr) throw billErr;
      navigate(`/print/hospital/${bill.id}`);
    } catch (err: any) {
      alert('ত্রুটি: ' + (err.message || 'বিল তৈরি করা যায়নি'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Patient Search */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <PatientSearch patientData={patientData} onChange={setPatientData} />
      </div>

      {/* Doctor, Cabin, Ref, Date, Time */}
      <div className="bg-white rounded-xl shadow-sm border p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ডাক্তার</label>
          <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className={inputClass}>
            <option value="">-- নির্বাচন করুন --</option>
            {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">কেবিন</label>
          <select value={selectedBed} onChange={(e) => setSelectedBed(e.target.value)} className={inputClass}>
            <option value="">-- নির্বাচন করুন --</option>
            {cabins.map((b) => (<option key={b.id} value={b.id}>{b.cabin_number} ({b.cabin_types?.type_name})</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ref / Prescription No</label>
          <input type="text" value={refNo} onChange={(e) => setRefNo(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">তারিখ</label>
          <input type="text" value={currentDate} readOnly className={`${inputClass} bg-gray-50`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">সময়</label>
          <input type="text" value={currentTime} readOnly className={`${inputClass} bg-gray-50`} />
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">সেবা সমূহ</h2>

        <div className="mb-2">
          <input
            type="text"
            placeholder="সেবা খুঁজুন..."
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className={`${inputClass} max-w-xs`}
          />
        </div>

        <div className="space-y-3">
          {serviceRows.map((row, idx) => (
            <div key={idx} className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-[180px]">
                {idx === 0 && <label className="block text-xs text-gray-500 mb-1">সেবা</label>}
                <select
                  value={row.serviceId}
                  onChange={(e) => handleServiceSelect(idx, e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- সেবা নির্বাচন --</option>
                  {filteredServices.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div className="w-20">
                {idx === 0 && <label className="block text-xs text-gray-500 mb-1">পরিমাণ</label>}
                <input
                  type="number"
                  min={1}
                  value={row.qty}
                  onChange={(e) => updateRow(idx, { qty: Math.max(1, +e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div className="w-28">
                {idx === 0 && <label className="block text-xs text-gray-500 mb-1">মূল্য (৳)</label>}
                <input
                  type="number"
                  min={0}
                  value={row.price}
                  onChange={(e) => updateRow(idx, { price: +e.target.value })}
                  readOnly={profile?.role !== 'admin'}
                  className={`${inputClass} ${profile?.role !== 'admin' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                title="সরান"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setServiceRows((prev) => [...prev, emptyRow()])}
          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <Plus className="h-4 w-4" /> সেবা যোগ করুন
        </button>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">পেমেন্ট</h2>

        <div className="flex flex-wrap gap-4">
          {['Cash', 'bKash/Nagad', 'Card', 'Due'].map((m) => (
            <label key={m} className="inline-flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="payment"
                value={m}
                checked={paymentMethod === m}
                onChange={() => setPaymentMethod(m)}
                className="accent-primary-500"
              />
              {m}
            </label>
          ))}
        </div>

        {paymentMethod === 'Due' && (
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">বকেয়া পরিমাণ (৳)</label>
            <input
              type="number"
              min={0}
              value={dueAmount}
              onChange={(e) => setDueAmount(+e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">ছাড় (৳)</label>
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(+e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="border-t pt-4 space-y-1 text-sm text-gray-700">
          <div className="flex justify-between"><span>সাবটোটাল</span><span>৳ {subtotal.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between"><span>ছাড়</span><span>- ৳ {discount.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t">
            <span>সর্বমোট</span><span>৳ {grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg px-6 py-3 transition disabled:opacity-50"
      >
        <Printer className="h-5 w-5" />
        {submitting ? 'অপেক্ষা করুন...' : 'বিল তৈরি করুন'}
      </button>
    </>
  );
}

// === IPD Admission Form ===
function IPDAdmission({
  doctors,
  cabins,
  profile,
  inputClass,
  navigate,
}: {
  doctors: Doctor[];
  cabins: CabinOption[];
  profile: any;
  inputClass: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [patientData, setPatientData] = useState({
    name: '', age: '', phone: '', address: '', id: null as string | null,
  });
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedCabin, setSelectedCabin] = useState('');
  const [contractAmount, setContractAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleAdmit = async () => {
    if (!patientData.name || !patientData.phone) {
      alert('রোগীর নাম ও ফোন নম্বর দিন');
      return;
    }
    if (!selectedCabin) {
      alert('কেবিন নির্বাচন করুন');
      return;
    }

    setSubmitting(true);
    try {
      let patientId = patientData.id;

      if (!patientId) {
        const { data, error } = await supabase
          .from('patients')
          .insert({ name: patientData.name, age: patientData.age, phone: patientData.phone, address: patientData.address })
          .select('id')
          .single();
        if (error) throw error;
        patientId = data.id;
      }

      // Generate patient code
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('ipd_admissions')
        .select('id', { count: 'exact', head: true });
      const seq = String((count || 0) + 1).padStart(4, '0');
      const patientCode = `IPD-${year}-${seq}`;

      const { data: admission, error: admErr } = await supabase
        .from('ipd_admissions')
        .insert({
          patient_id: patientId,
          patient_code: patientCode,
          doctor_id: selectedDoctor || null,
          cabin_id: selectedCabin,
          contract_amount: contractAmount,
          admission_date: new Date().toISOString(),
          status: 'admitted',
          created_by: profile?.id ?? null,
        })
        .select('id')
        .single();

      if (admErr) throw admErr;

      // Mark cabin as occupied
      await supabase.from('beds').update({ status: 'Occupied' }).eq('id', selectedCabin);

      navigate(`/ipd/${admission.id}`);
    } catch (err: any) {
      alert('ত্রুটি: ' + (err.message || 'ভর্তি করা যায়নি'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Patient Search */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <PatientSearch patientData={patientData} onChange={setPatientData} />
      </div>

      {/* Admission details */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">ভর্তি তথ্য</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ডাক্তার</label>
            <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className={inputClass}>
              <option value="">-- নির্বাচন করুন --</option>
              {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">চুক্তির পরিমাণ (৳)</label>
            <input
              type="number"
              min={0}
              value={contractAmount || ''}
              onChange={(e) => setContractAmount(+e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Cabin selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">কেবিন নির্বাচন করুন</label>
          {cabins.length === 0 ? (
            <p className="text-sm text-gray-400">কোনো কেবিন খালি নেই</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cabins.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCabin(c.id)}
                  className={`p-3 rounded-lg border text-left transition ${
                    selectedCabin === c.id
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{c.cabin_number}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">খালি</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{c.cabin_types?.type_name ?? '—'}</p>
                  <p className="text-xs text-gray-600 font-medium">{c.cabin_types?.daily_charge ?? 0} টাকা/দিন</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admitted patients list link */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleAdmit}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg px-6 py-3 transition disabled:opacity-50"
        >
          {submitting ? 'অপেক্ষা করুন...' : 'ভর্তি করুন'}
        </button>
        <button
          onClick={() => navigate('/ipd')}
          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <FileText className="w-4 h-4" /> ভর্তি রোগীর তালিকা
        </button>
      </div>
    </>
  );
}
