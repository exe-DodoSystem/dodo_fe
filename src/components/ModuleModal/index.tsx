import './modal.css';

interface ModuleModalProps {
  onClose: () => void;
}

export default function ModuleModal({ onClose }: ModuleModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 module-modal-overlay">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden module-modal">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Chi tiết Tính năng Module</h2>
            <p className="text-slate-500 font-inter text-sm">Khám phá các công cụ quản trị mạnh mẽ từ hệ sinh thái DODO.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {/* Item 1 */}
          <div className="feature-item bg-white border border-gray-100 rounded-2xl p-6 flex gap-6">
             <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined">badge</span>
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">Quản lý Nhân sự</h3>
               <p className="text-slate-600 font-inter text-sm leading-relaxed">Hệ thống danh sách nhân sự tập trung, cho phép chỉnh sửa hồ sơ chuyên sâu (hợp đồng, bảo hiểm, bằng cấp). Cơ chế phân quyền thông minh giữa <strong>Admin</strong> và <strong>Manager</strong> giúp tối ưu hóa luồng công việc.</p>
             </div>
          </div>

          {/* Item 2 */}
          <div className="feature-item bg-white border border-gray-100 rounded-2xl p-6 flex gap-6">
             <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined">location_on</span>
             </div>
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <h3 className="text-lg font-bold text-slate-900">Chấm công (Logic mới)</h3>
                 <span className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">CẬP NHẬT</span>
               </div>
               <p className="text-slate-600 font-inter text-sm leading-relaxed">Xác thực vị trí <strong>GPS</strong> khi Check-in. Áp dụng quy tắc nghiêm ngặt 08:30 (Đúng giờ/Muộn). Nhân viên có thể chủ động tự Check-out và theo dõi lịch sử công hàng ngày một cách minh bạch.</p>
             </div>
          </div>

          {/* Item 3 */}
          <div className="feature-item bg-white border border-gray-100 rounded-2xl p-6 flex gap-6">
             <div className="size-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined">groups</span>
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">Quản lý Khách hàng</h3>
               <p className="text-slate-600 font-inter text-sm leading-relaxed">Lưu trữ thông tin khách hàng chi tiết 360 độ. Theo dõi danh sách module khách đã mua, tổng chi tiêu tích lũy và ngày giao dịch gần nhất để đưa ra chiến lược chăm sóc phù hợp.</p>
             </div>
          </div>

          {/* Item 4 */}
          <div className="feature-item bg-white border border-gray-100 rounded-2xl p-6 flex gap-6">
             <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined">shopping_cart</span>
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">Quản lý Đơn hàng</h3>
               <p className="text-slate-600 font-inter text-sm leading-relaxed">Quy trình tạo đơn hàng chuẩn hóa, cập nhật trạng thái đơn hàng theo thời gian thực (Chờ duyệt, Đang giao, Hoàn tất). Tự động tính toán và theo dõi <em>"Ngày nhận hàng dự kiến"</em>.</p>
             </div>
          </div>

          {/* Item 5 */}
          <div className="feature-item bg-white border border-gray-100 rounded-2xl p-6 flex gap-6">
             <div className="size-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined">inventory_2</span>
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">Quản lý Kho hàng</h3>
               <p className="text-slate-600 font-inter text-sm leading-relaxed mb-3">Nhập kho thông minh theo mã <strong>SKU</strong>, quản lý vị trí chính xác (ví dụ: Kho A - Gỗ, Kho B - Gạch).</p>
               <div className="flex gap-2">
                 <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase"><div className="size-1.5 rounded-full bg-rose-500"></div> HẾT HÀNG</span>
                 <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase"><div className="size-1.5 rounded-full bg-orange-500"></div> SẮP HẾT</span>
                 <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase"><div className="size-1.5 rounded-full bg-amber-500"></div> CẦN NHẬP</span>
               </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-4 bg-white">
          <button onClick={onClose} className="px-8 py-3 text-blue-600 font-bold border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition-colors">Quay về</button>
          <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Dùng thử ngay</button>
        </div>
      </div>
    </div>
  );
}
