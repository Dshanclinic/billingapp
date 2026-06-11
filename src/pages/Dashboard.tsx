import { useNavigate } from 'react-router-dom';
import { Building2, Microscope } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto pt-12">
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">বিলিং সিস্টেম</h1>
      <p className="text-gray-500 text-center mb-10">বিল তৈরি করতে নিচের যেকোনো একটি নির্বাচন করুন</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/hospital-billing')}
          className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-primary-500 hover:shadow-lg transition-all duration-200 text-left"
        >
          <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
            <Building2 className="w-7 h-7 text-primary-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">হাসপাতাল বিলিং</h2>
          <p className="text-gray-500 text-sm">ভর্তি রোগী, বেড চার্জ, ডাক্তার ভিজিট ও অন্যান্য হাসপাতাল সেবার বিল</p>
        </button>

        <button
          onClick={() => navigate('/diagnostic-billing')}
          className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-primary-500 hover:shadow-lg transition-all duration-200 text-left"
        >
          <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
            <Microscope className="w-7 h-7 text-teal-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ডায়াগনস্টিক বিলিং</h2>
          <p className="text-gray-500 text-sm">পরীক্ষা-নিরীক্ষা, এক্স-রে, আল্ট্রাসনো, প্যাথলজি ও অন্যান্য ডায়াগনস্টিক সেবার বিল</p>
        </button>
      </div>
    </div>
  );
}
