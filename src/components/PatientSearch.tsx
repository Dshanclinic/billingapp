import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PatientSearchProps {
  patientData: {
    name: string;
    age: string;
    phone: string;
    address: string;
    id: string | null;
  };
  onChange: (data: PatientSearchProps['patientData']) => void;
}

export default function PatientSearch({ patientData, onChange }: PatientSearchProps) {
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (field: string, value: string) => {
    onChange({ ...patientData, [field]: value });
  };

  const handlePhoneChange = (value: string) => {
    update('phone', value);
    setStatus('idle');

    if (timerRef.current) clearTimeout(timerRef.current);

    if (value.length >= 11) {
      timerRef.current = setTimeout(() => searchPatient(value), 500);
    }
  };

  const searchPatient = async (phone: string) => {
    setStatus('searching');
    const { data } = await supabase
      .from('patients')
      .select('id, name, age, phone, address')
      .eq('phone', phone)
      .maybeSingle();

    if (data) {
      onChange({
        id: data.id,
        name: data.name || '',
        age: data.age || '',
        phone: data.phone,
        address: data.address || '',
      });
      setStatus('found');
    } else {
      onChange({ ...patientData, phone, id: null });
      setStatus('not_found');
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ফোন নম্বর দিয়ে রোগী খুঁজুন
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={patientData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        {status === 'searching' && (
          <p className="text-xs text-primary-500 mt-1">খুঁজছি...</p>
        )}
        {status === 'found' && (
          <p className="text-xs text-green-600 mt-1">রোগী পাওয়া গেছে</p>
        )}
        {status === 'not_found' && (
          <p className="text-xs text-amber-600 mt-1">নতুন রোগী — তথ্য সংরক্ষণ হবে</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">রোগীর নাম</label>
          <input
            type="text"
            value={patientData.name}
            onChange={(e) => update('name', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">বয়স</label>
          <input
            type="text"
            value={patientData.age}
            onChange={(e) => update('age', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা</label>
          <input
            type="text"
            value={patientData.address}
            onChange={(e) => update('address', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
