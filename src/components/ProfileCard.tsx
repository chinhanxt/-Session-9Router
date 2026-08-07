import { Zap } from 'lucide-react';
import { ParsedProfile } from '../types/connection';
import { formatVietnameseDate } from '../utils/helpers';

interface ProfileCardProps {
  parsedProfile: ParsedProfile;
}

export function ProfileCard({ parsedProfile }: ProfileCardProps) {
  const planName = parsedProfile.plan || 'Free';
  const isPlus = planName.toLowerCase() === 'plus';

  return (
    <div className="p-6 flex-grow flex flex-col justify-center items-center space-y-6 bg-gradient-to-b from-purple-50/20 to-white animate-fade-in">
      {/* Ảnh đại diện người dùng */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
        {parsedProfile.avatar ? (
          <img 
            src={parsedProfile.avatar} 
            alt="Avatar" 
            className="w-16 h-16 rounded-full border-2 border-purple-200 relative z-10 object-cover shadow-inner"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-purple-200 bg-purple-50 flex items-center justify-center relative z-10">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
        )}
      </div>

      {/* Tên & Email */}
      <div className="text-center space-y-1">
        <h3 className="text-base font-extrabold text-purple-950">{parsedProfile.name || 'Tài khoản 9Router'}</h3>
        <p className="text-xs text-slate-500 font-light">{parsedProfile.email}</p>
      </div>

      {/* Phân loại tài khoản */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wider ${
          isPlus 
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/10' 
            : 'bg-purple-100 text-purple-700'
        }`}>
          Gói {planName.toUpperCase()}
        </span>
      </div>

      {/* Thời gian hết hạn */}
      <div className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex items-center gap-3 text-left">
        <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hết hạn Session (Dự kiến)</p>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">
            {formatVietnameseDate(parsedProfile.expires)}
          </p>
        </div>
      </div>
    </div>
  );
}
