import { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard as Edit2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Receptionist {
  id: string;
  full_name: string;
  email: string;
}

interface RoomUser {
  id: string;
  full_name: string;
  email: string;
  room_type: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
}

interface CabinType {
  id: string;
  type_name: string;
  daily_charge: number;
}

interface Cabin {
  id: string;
  cabin_number: string;
  cabin_type_id: string | null;
  status: 'Available' | 'Occupied';
  cabin_types?: { type_name: string; daily_charge: number } | null;
}

interface ExtraCopy {
  copy_name: string;
}

interface HospitalService {
  id: string;
  name: string;
  default_price: number;
  extra_copies_json: ExtraCopy[];
}

interface DiagnosticService {
  id: string;
  name: string;
  default_price: number;
  extra_copies_json: ExtraCopy[];
}

type Tab = 'receptionists' | 'room_users' | 'doctors' | 'cabins' | 'hospital_services' | 'diagnostic_services';

const TABS: { key: Tab; label: string }[] = [
  { key: 'receptionists', label: 'রিসেপশনিস্ট' },
  { key: 'room_users', label: 'রুম ইউজার' },
  { key: 'doctors', label: 'ডাক্তার' },
  { key: 'cabins', label: 'কেবিন' },
  { key: 'hospital_services', label: 'হাসপাতাল সেবা' },
  { key: 'diagnostic_services', label: 'ডায়াগনস্টিক সেবা' },
];

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';
const btnPrimary =
  'inline-flex items-center gap-1.5 bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors';
const btnDanger =
  'inline-flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors text-sm';
const btnSecondary =
  'inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors text-sm';

const ROOM_TYPES = ['X-Ray', 'Ultrasonography', 'Pathology', 'Other'];

export default function Settings() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('receptionists');

  // ---- Receptionists ----
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [recForm, setRecForm] = useState({ full_name: '', email: '', password: '' });
  const [recLoading, setRecLoading] = useState(false);

  async function loadReceptionists() {
    const { data } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'receptionist');
    if (data) setReceptionists(data);
  }

  async function createReceptionist() {
    if (!recForm.full_name || !recForm.email || !recForm.password) return;
    setRecLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-receptionist`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create', ...recForm }),
      });
      setRecForm({ full_name: '', email: '', password: '' });
      await loadReceptionists();
    } finally {
      setRecLoading(false);
    }
  }

  async function deleteUser(id: string) {
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-receptionist`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'delete', userId: id }),
    });
  }

  async function deleteReceptionist(id: string) {
    await deleteUser(id);
    await loadReceptionists();
  }

  // ---- Room Users ----
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [roomForm, setRoomForm] = useState({ full_name: '', email: '', password: '', room_type: 'X-Ray' });
  const [roomLoading, setRoomLoading] = useState(false);

  async function loadRoomUsers() {
    const { data } = await supabase.from('profiles').select('id, full_name, email, room_type').eq('role', 'room_user');
    if (data) setRoomUsers(data as RoomUser[]);
  }

  async function createRoomUser() {
    if (!roomForm.full_name || !roomForm.email || !roomForm.password) return;
    setRoomLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-receptionist`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create', role: 'room_user', ...roomForm }),
      });
      setRoomForm({ full_name: '', email: '', password: '', room_type: 'X-Ray' });
      await loadRoomUsers();
    } finally {
      setRoomLoading(false);
    }
  }

  async function deleteRoomUser(id: string) {
    await deleteUser(id);
    await loadRoomUsers();
  }

  // ---- Doctors ----
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [docForm, setDocForm] = useState({ name: '', specialty: '', phone: '' });
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);

  async function loadDoctors() {
    const { data } = await supabase.from('doctors').select('*');
    if (data) setDoctors(data);
  }

  async function saveDoctor() {
    if (!docForm.name) return;
    if (editingDoc) {
      await supabase.from('doctors').update(docForm).eq('id', editingDoc.id);
      setEditingDoc(null);
    } else {
      await supabase.from('doctors').insert(docForm);
    }
    setDocForm({ name: '', specialty: '', phone: '' });
    await loadDoctors();
  }

  async function deleteDoctor(id: string) {
    await supabase.from('doctors').delete().eq('id', id);
    await loadDoctors();
  }

  // ---- Cabin Types ----
  const [cabinTypes, setCabinTypes] = useState<CabinType[]>([]);
  const [ctForm, setCtForm] = useState({ type_name: '', daily_charge: 0 });
  const [editingCT, setEditingCT] = useState<CabinType | null>(null);

  async function loadCabinTypes() {
    const { data } = await supabase.from('cabin_types').select('*').order('daily_charge');
    if (data) setCabinTypes(data);
  }

  async function saveCabinType() {
    if (!ctForm.type_name) return;
    if (editingCT) {
      await supabase.from('cabin_types').update(ctForm).eq('id', editingCT.id);
      setEditingCT(null);
    } else {
      await supabase.from('cabin_types').insert(ctForm);
    }
    setCtForm({ type_name: '', daily_charge: 0 });
    await loadCabinTypes();
  }

  async function deleteCabinType(id: string) {
    await supabase.from('cabin_types').delete().eq('id', id);
    await loadCabinTypes();
  }

  // ---- Cabins ----
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [cabinForm, setCabinForm] = useState({ cabin_number: '', cabin_type_id: '', status: 'Available' as Cabin['status'] });
  const [editingCabin, setEditingCabin] = useState<Cabin | null>(null);

  async function loadCabins() {
    const { data } = await supabase.from('beds').select('id, cabin_number, cabin_type_id, status, cabin_types(type_name, daily_charge)');
    if (data) setCabins(data as unknown as Cabin[]);
  }

  async function saveCabin() {
    if (!cabinForm.cabin_number) return;
    const payload = {
      cabin_number: cabinForm.cabin_number,
      cabin_type_id: cabinForm.cabin_type_id || null,
      status: cabinForm.status,
    };
    if (editingCabin) {
      await supabase.from('beds').update(payload).eq('id', editingCabin.id);
      setEditingCabin(null);
    } else {
      await supabase.from('beds').insert(payload);
    }
    setCabinForm({ cabin_number: '', cabin_type_id: '', status: 'Available' });
    await loadCabins();
  }

  async function deleteCabin(id: string) {
    await supabase.from('beds').delete().eq('id', id);
    await loadCabins();
  }

  // ---- Hospital Services ----
  const [hospServices, setHospServices] = useState<HospitalService[]>([]);
  const [hospForm, setHospForm] = useState({ name: '', default_price: 0, extra_copies_json: [] as ExtraCopy[] });
  const [hospCopyCount, setHospCopyCount] = useState(0);
  const [editingHosp, setEditingHosp] = useState<HospitalService | null>(null);

  async function loadHospServices() {
    const { data } = await supabase.from('hospital_services').select('*');
    if (data) setHospServices(data);
  }

  async function saveHospService() {
    if (!hospForm.name) return;
    const payload = { ...hospForm, extra_copies_json: hospForm.extra_copies_json.slice(0, hospCopyCount) };
    if (editingHosp) {
      await supabase.from('hospital_services').update(payload).eq('id', editingHosp.id);
      setEditingHosp(null);
    } else {
      await supabase.from('hospital_services').insert(payload);
    }
    setHospForm({ name: '', default_price: 0, extra_copies_json: [] });
    setHospCopyCount(0);
    await loadHospServices();
  }

  async function deleteHospService(id: string) {
    await supabase.from('hospital_services').delete().eq('id', id);
    await loadHospServices();
  }

  // ---- Diagnostic Services ----
  const [diagServices, setDiagServices] = useState<DiagnosticService[]>([]);
  const [diagForm, setDiagForm] = useState({ name: '', default_price: 0, extra_copies_json: [] as ExtraCopy[] });
  const [diagCopyCount, setDiagCopyCount] = useState(0);
  const [editingDiag, setEditingDiag] = useState<DiagnosticService | null>(null);

  async function loadDiagServices() {
    const { data } = await supabase.from('diagnostic_services').select('*');
    if (data) setDiagServices(data);
  }

  async function saveDiagService() {
    if (!diagForm.name) return;
    const payload = { ...diagForm, extra_copies_json: diagForm.extra_copies_json.slice(0, diagCopyCount) };
    if (editingDiag) {
      await supabase.from('diagnostic_services').update(payload).eq('id', editingDiag.id);
      setEditingDiag(null);
    } else {
      await supabase.from('diagnostic_services').insert(payload);
    }
    setDiagForm({ name: '', default_price: 0, extra_copies_json: [] });
    setDiagCopyCount(0);
    await loadDiagServices();
  }

  async function deleteDiagService(id: string) {
    await supabase.from('diagnostic_services').delete().eq('id', id);
    await loadDiagServices();
  }

  // ---- Load data on tab change ----
  useEffect(() => {
    if (activeTab === 'receptionists') loadReceptionists();
    else if (activeTab === 'room_users') loadRoomUsers();
    else if (activeTab === 'doctors') loadDoctors();
    else if (activeTab === 'cabins') { loadCabins(); loadCabinTypes(); }
    else if (activeTab === 'hospital_services') loadHospServices();
    else if (activeTab === 'diagnostic_services') loadDiagServices();
  }, [activeTab]);

  // ---- Shared service form & table renderers ----
  function renderServiceForm(
    form: { name: string; default_price: number; extra_copies_json: ExtraCopy[] },
    setForm: (v: typeof form) => void,
    copyCount: number,
    setCopyCount: (n: number) => void,
    onSave: () => void,
    editing: boolean,
    onCancel: () => void,
  ) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
        <h3 className="font-semibold text-gray-700 text-sm">{editing ? 'সেবা সম্পাদনা' : 'নতুন সেবা যোগ করুন'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">সেবার নাম</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">মূল্য (টাকা)</label>
            <input className={inputClass} type="number" value={form.default_price || ''} onChange={(e) => setForm({ ...form, default_price: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">অতিরিক্ত কপি সংখ্যা</label>
          <select className={inputClass + ' w-auto'} value={copyCount} onChange={(e) => setCopyCount(Number(e.target.value))}>
            <option value={0}>০</option>
            <option value={1}>১</option>
            <option value={2}>২</option>
          </select>
        </div>
        {Array.from({ length: copyCount }).map((_, i) => (
          <div key={i}>
            <label className="block text-xs text-gray-500 mb-1">কপি {i + 1} এর নাম</label>
            <input
              className={inputClass}
              value={form.extra_copies_json[i]?.copy_name || ''}
              onChange={(e) => {
                const updated = [...form.extra_copies_json];
                while (updated.length <= i) updated.push({ copy_name: '' });
                updated[i] = { copy_name: e.target.value };
                setForm({ ...form, extra_copies_json: updated });
              }}
            />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <button className={btnPrimary} onClick={onSave}>
            <Save className="w-4 h-4" /> {editing ? 'আপডেট করুন' : 'যোগ করুন'}
          </button>
          {editing && (
            <button className={btnSecondary} onClick={onCancel}>
              <X className="w-4 h-4" /> বাতিল
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderServiceTable(
    items: (HospitalService | DiagnosticService)[],
    onEdit: (item: HospitalService | DiagnosticService) => void,
    onDelete: (id: string) => void,
  ) {
    if (!items.length) return <p className="text-sm text-gray-400">কোনো সেবা পাওয়া যায়নি।</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 font-medium">নাম</th>
              <th className="pb-2 font-medium">মূল্য</th>
              <th className="pb-2 font-medium">অতিরিক্ত কপি</th>
              <th className="pb-2 font-medium text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2">{item.name}</td>
                <td className="py-2">{item.default_price} টাকা</td>
                <td className="py-2">
                  {(item.extra_copies_json || []).map((c) => c.copy_name).filter(Boolean).join(', ') || '-'}
                </td>
                <td className="py-2 text-right">
                  <div className="flex gap-3 justify-end">
                    <button className={btnSecondary} onClick={() => onEdit(item)}><Edit2 className="w-4 h-4" /></button>
                    <button className={btnDanger} onClick={() => onDelete(item.id)}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ---- Tab Content ----
  function renderReceptionists() {
    return (
      <div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm">নতুন রিসেপশনিস্ট যোগ করুন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">পুরো নাম</label>
              <input className={inputClass} value={recForm.full_name} onChange={(e) => setRecForm({ ...recForm, full_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ইমেইল</label>
              <input className={inputClass} type="email" value={recForm.email} onChange={(e) => setRecForm({ ...recForm, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">পাসওয়ার্ড</label>
              <input className={inputClass} type="password" value={recForm.password} onChange={(e) => setRecForm({ ...recForm, password: e.target.value })} />
            </div>
          </div>
          <button className={btnPrimary} onClick={createReceptionist} disabled={recLoading}>
            <Plus className="w-4 h-4" /> {recLoading ? 'প্রসেস হচ্ছে...' : 'যোগ করুন'}
          </button>
        </div>
        {receptionists.length === 0 ? (
          <p className="text-sm text-gray-400">কোনো রিসেপশনিস্ট পাওয়া যায়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">নাম</th>
                  <th className="pb-2 font-medium">ইমেইল</th>
                  <th className="pb-2 font-medium text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {receptionists.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2">{r.full_name}</td>
                    <td className="py-2">{r.email}</td>
                    <td className="py-2 text-right">
                      <button className={btnDanger} onClick={() => deleteReceptionist(r.id)}>
                        <Trash2 className="w-4 h-4" /> মুছুন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderRoomUsers() {
    return (
      <div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm">নতুন রুম ইউজার যোগ করুন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">পুরো নাম</label>
              <input className={inputClass} value={roomForm.full_name} onChange={(e) => setRoomForm({ ...roomForm, full_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ইমেইল</label>
              <input className={inputClass} type="email" value={roomForm.email} onChange={(e) => setRoomForm({ ...roomForm, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">পাসওয়ার্ড</label>
              <input className={inputClass} type="password" value={roomForm.password} onChange={(e) => setRoomForm({ ...roomForm, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">রুম টাইপ</label>
              <select className={inputClass} value={roomForm.room_type} onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}>
                {ROOM_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
              </select>
            </div>
          </div>
          <button className={btnPrimary} onClick={createRoomUser} disabled={roomLoading}>
            <Plus className="w-4 h-4" /> {roomLoading ? 'প্রসেস হচ্ছে...' : 'যোগ করুন'}
          </button>
        </div>
        {roomUsers.length === 0 ? (
          <p className="text-sm text-gray-400">কোনো রুম ইউজার পাওয়া যায়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">নাম</th>
                  <th className="pb-2 font-medium">ইমেইল</th>
                  <th className="pb-2 font-medium">রুম টাইপ</th>
                  <th className="pb-2 font-medium text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {roomUsers.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2">{r.full_name}</td>
                    <td className="py-2">{r.email}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{r.room_type}</span>
                    </td>
                    <td className="py-2 text-right">
                      <button className={btnDanger} onClick={() => deleteRoomUser(r.id)}>
                        <Trash2 className="w-4 h-4" /> মুছুন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderDoctors() {
    return (
      <div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm">{editingDoc ? 'ডাক্তার সম্পাদনা' : 'নতুন ডাক্তার যোগ করুন'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">নাম</label>
              <input className={inputClass} value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">বিশেষত্ব</label>
              <input className={inputClass} value={docForm.specialty} onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ফোন</label>
              <input className={inputClass} value={docForm.phone} onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className={btnPrimary} onClick={saveDoctor}>
              {editingDoc ? <><Save className="w-4 h-4" /> আপডেট করুন</> : <><Plus className="w-4 h-4" /> যোগ করুন</>}
            </button>
            {editingDoc && (
              <button className={btnSecondary} onClick={() => { setEditingDoc(null); setDocForm({ name: '', specialty: '', phone: '' }); }}>
                <X className="w-4 h-4" /> বাতিল
              </button>
            )}
          </div>
        </div>
        {doctors.length === 0 ? (
          <p className="text-sm text-gray-400">কোনো ডাক্তার পাওয়া যায়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">নাম</th>
                  <th className="pb-2 font-medium">বিশেষত্ব</th>
                  <th className="pb-2 font-medium">ফোন</th>
                  <th className="pb-2 font-medium text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100">
                    <td className="py-2">{d.name}</td>
                    <td className="py-2">{d.specialty}</td>
                    <td className="py-2">{d.phone}</td>
                    <td className="py-2 text-right">
                      <div className="flex gap-3 justify-end">
                        <button className={btnSecondary} onClick={() => { setEditingDoc(d); setDocForm({ name: d.name, specialty: d.specialty, phone: d.phone }); }}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className={btnDanger} onClick={() => deleteDoctor(d.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderCabins() {
    return (
      <div className="space-y-8">
        {/* Cabin Types Section */}
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3 border-b pb-2">কেবিন ধরন ও দৈনিক চার্জ</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
            <h4 className="font-semibold text-gray-700 text-sm">{editingCT ? 'কেবিন ধরন সম্পাদনা' : 'নতুন কেবিন ধরন যোগ করুন'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ধরনের নাম</label>
                <input className={inputClass} placeholder="যেমন: Ward, VIP Cabin" value={ctForm.type_name} onChange={(e) => setCtForm({ ...ctForm, type_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">দৈনিক চার্জ (৳)</label>
                <input className={inputClass} type="number" value={ctForm.daily_charge || ''} onChange={(e) => setCtForm({ ...ctForm, daily_charge: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className={btnPrimary} onClick={saveCabinType}>
                {editingCT ? <><Save className="w-4 h-4" /> আপডেট করুন</> : <><Plus className="w-4 h-4" /> যোগ করুন</>}
              </button>
              {editingCT && (
                <button className={btnSecondary} onClick={() => { setEditingCT(null); setCtForm({ type_name: '', daily_charge: 0 }); }}>
                  <X className="w-4 h-4" /> বাতিল
                </button>
              )}
            </div>
          </div>
          {cabinTypes.length === 0 ? (
            <p className="text-sm text-gray-400">কোনো কেবিন ধরন পাওয়া যায়নি।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">ধরন</th>
                    <th className="pb-2 font-medium">দৈনিক চার্জ</th>
                    <th className="pb-2 font-medium text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {cabinTypes.map((ct) => (
                    <tr key={ct.id} className="border-b border-gray-100">
                      <td className="py-2">{ct.type_name}</td>
                      <td className="py-2">৳{ct.daily_charge}</td>
                      <td className="py-2 text-right">
                        <div className="flex gap-3 justify-end">
                          <button className={btnSecondary} onClick={() => { setEditingCT(ct); setCtForm({ type_name: ct.type_name, daily_charge: ct.daily_charge }); }}>
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className={btnDanger} onClick={() => deleteCabinType(ct.id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cabin List Section */}
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3 border-b pb-2">কেবিন তালিকা</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
            <h4 className="font-semibold text-gray-700 text-sm">{editingCabin ? 'কেবিন সম্পাদনা' : 'নতুন কেবিন যোগ করুন'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">কেবিন নম্বর</label>
                <input className={inputClass} placeholder="যেমন: 201, 302" value={cabinForm.cabin_number} onChange={(e) => setCabinForm({ ...cabinForm, cabin_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">কেবিন ধরন</label>
                <select className={inputClass} value={cabinForm.cabin_type_id} onChange={(e) => setCabinForm({ ...cabinForm, cabin_type_id: e.target.value })}>
                  <option value="">-- নির্বাচন করুন --</option>
                  {cabinTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.type_name} (৳{ct.daily_charge}/দিন)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">অবস্থা</label>
                <select className={inputClass} value={cabinForm.status} onChange={(e) => setCabinForm({ ...cabinForm, status: e.target.value as Cabin['status'] })}>
                  <option value="Available">খালি</option>
                  <option value="Occupied">ভরা</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button className={btnPrimary} onClick={saveCabin}>
                {editingCabin ? <><Save className="w-4 h-4" /> আপডেট করুন</> : <><Plus className="w-4 h-4" /> যোগ করুন</>}
              </button>
              {editingCabin && (
                <button className={btnSecondary} onClick={() => { setEditingCabin(null); setCabinForm({ cabin_number: '', cabin_type_id: '', status: 'Available' }); }}>
                  <X className="w-4 h-4" /> বাতিল
                </button>
              )}
            </div>
          </div>
          {cabins.length === 0 ? (
            <p className="text-sm text-gray-400">কোনো কেবিন পাওয়া যায়নি।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">কেবিন নম্বর</th>
                    <th className="pb-2 font-medium">ধরন</th>
                    <th className="pb-2 font-medium">দৈনিক চার্জ</th>
                    <th className="pb-2 font-medium">অবস্থা</th>
                    <th className="pb-2 font-medium text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {cabins.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="py-2">{c.cabin_number}</td>
                      <td className="py-2">{c.cabin_types?.type_name ?? '—'}</td>
                      <td className="py-2">৳{c.cabin_types?.daily_charge ?? '—'}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.status === 'Available' ? 'খালি' : 'ভরা'}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex gap-3 justify-end">
                          <button className={btnSecondary} onClick={() => { setEditingCabin(c); setCabinForm({ cabin_number: c.cabin_number, cabin_type_id: c.cabin_type_id || '', status: c.status }); }}>
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className={btnDanger} onClick={() => deleteCabin(c.id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderHospitalServices() {
    return (
      <div>
        {renderServiceForm(
          hospForm,
          (v) => setHospForm(v),
          hospCopyCount,
          setHospCopyCount,
          saveHospService,
          !!editingHosp,
          () => { setEditingHosp(null); setHospForm({ name: '', default_price: 0, extra_copies_json: [] }); setHospCopyCount(0); },
        )}
        {renderServiceTable(
          hospServices,
          (item) => {
            const s = item as HospitalService;
            setEditingHosp(s);
            setHospForm({ name: s.name, default_price: s.default_price, extra_copies_json: s.extra_copies_json || [] });
            setHospCopyCount((s.extra_copies_json || []).length);
          },
          deleteHospService,
        )}
      </div>
    );
  }

  function renderDiagnosticServices() {
    return (
      <div>
        {renderServiceForm(
          diagForm,
          (v) => setDiagForm(v),
          diagCopyCount,
          setDiagCopyCount,
          saveDiagService,
          !!editingDiag,
          () => { setEditingDiag(null); setDiagForm({ name: '', default_price: 0, extra_copies_json: [] }); setDiagCopyCount(0); },
        )}
        {renderServiceTable(
          diagServices,
          (item) => {
            const s = item as DiagnosticService;
            setEditingDiag(s);
            setDiagForm({ name: s.name, default_price: s.default_price, extra_copies_json: s.extra_copies_json || [] });
            setDiagCopyCount((s.extra_copies_json || []).length);
          },
          deleteDiagService,
        )}
      </div>
    );
  }

  const tabContent: Record<Tab, () => JSX.Element> = {
    receptionists: renderReceptionists,
    room_users: renderRoomUsers,
    doctors: renderDoctors,
    cabins: renderCabins,
    hospital_services: renderHospitalServices,
    diagnostic_services: renderDiagnosticServices,
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">সেটিংস</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-1 -mb-px min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {tabContent[activeTab]()}
      </div>
    </div>
  );
}
