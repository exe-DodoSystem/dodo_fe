import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import ModuleModal from "../../components/ModuleModal";
import { ALL_MODULES } from "../../types/auth";
import "./landing.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedModules, setSelectedModules] = useState<number[]>([1, 2]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModule = (id: number) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const price = selectedModules.reduce((sum, id) => {
    const mod = ALL_MODULES.find(m => m.numericId === id);
    return sum + (mod?.monthlyPrice ?? 0);
  }, 0);

  return (
    <div className="landing-page min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="px-6 lg:px-12">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 bg-[var(--primary)] rounded-xl text-white shadow-lg shadow-blue-200">
                <span className="material-symbols-outlined text-2xl">
                  deployed_code
                </span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                DODO <span className="text-[var(--primary)]">System</span>
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-10">
              <a
                className="text-sm font-semibold text-slate-600 hover:text-[var(--primary)] transition-colors cursor-pointer"
                onClick={() => navigate('/products')}
              >
                Sản phẩm
              </a>
              <a
                className="text-sm font-semibold text-slate-600 hover:text-[var(--primary)] transition-colors"
                href="#"
              >
                Tính năng
              </a>
              <a
                className="text-sm font-semibold text-slate-600 hover:text-[var(--primary)] transition-colors"
                href="#"
              >
                Bảng giá
              </a>
              <a
                className="text-sm font-semibold text-slate-600 hover:text-[var(--primary)] transition-colors"
                href="#"
              >
                Liên hệ
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/login')}
                className="px-6 py-2.5 text-sm font-bold text-[var(--primary)] hover:bg-blue-50 rounded-lg transition-colors">
                Đăng nhập
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2.5 text-sm font-bold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors shadow-md shadow-blue-100"
              >
                Dùng thử miễn phí
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="pt-10 pb-20 px-6 lg:px-12">
          <div>
            <div className="relative w-full rounded-[3rem] overflow-hidden min-h-[550px] flex items-center justify-center text-center px-6">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDIXQIgq0MSAs6ngFvpDJECeBY_8SLnKBx3U3AcGKKKMvgmiogmh177yng7BvY7QtQFxlzSQ1Gg_IaYKUyONBXtwuELrn_3kncCVNuZ5JWlcgk0CQN0pyV5ds7hJx8X497HmgVmhiaf6-_rMfyreVMhrk99llxbIRhjQShE_4dV7Lyu2xqcFW3Le3byHSeVp-KyfZnrQwCXQdRcZO1PIot5ErfarhMCw-aTWBhQH8wqjlZt2mDTiudE7MWrkd0JgYfNvhpU-rPvLC3x')",
                }}
              ></div>
              <div className="absolute inset-0 hero-overlay"></div>
              <div className="relative z-10 max-w-4xl">
                <span className="inline-block px-4 py-1.5 mb-8 text-xs font-bold tracking-[0.2em] text-blue-400 uppercase bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                  Giải pháp doanh nghiệp 4.0
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.15] text-center max-w-4xl mx-auto">
                  Nền Tảng Quản Trị Doanh Nghiệp SME
                </h1>
                <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto text-center leading-relaxed">
                  Tùy chỉnh hệ thống linh hoạt theo nhu cầu vận hành của bạn.
                  Một hệ sinh thái duy nhất để quản trị mọi hoạt động kinh doanh
                  chuyên nghiệp.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="px-8 py-4 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/20">
                    Khám phá ngay
                  </button>
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold rounded-xl hover:bg-white/20 transition-all">
                    Tư vấn miễn phí
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24 px-6 lg:px-12">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                Tùy chỉnh hệ thống theo nhu cầu
              </h2>
              <p className="text-[var(--text-muted)] font-inter">
                Chọn các module bạn cần để bắt đầu xây dựng hệ thống quản trị
                tối ưu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {ALL_MODULES.map((module) => (
                <div
                  key={module.numericId}
                  onClick={() => toggleModule(module.numericId)}
                  className={`module-card bg-white p-8 rounded-2xl shadow-sm border ${selectedModules.includes(module.numericId) ? "selected border-[var(--primary)]" : "border-gray-100"} flex flex-col items-center text-center`}
                >
                  <div className="absolute top-4 right-4">
                    <input
                      checked={selectedModules.includes(module.numericId)}
                      onChange={() => { }}
                      className="custom-checkbox"
                      type="checkbox"
                    />
                  </div>
                  <div className="size-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[var(--primary)] mb-6" style={{ backgroundColor: `${module.color}15`, color: module.color }}>
                    <span className="material-symbols-outlined text-4xl">
                      {module.icon}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {module.label}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] font-inter">
                    {module.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-12 mb-10">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-10 py-5 text-lg font-bold bg-white text-[var(--primary)] border-2 border-[var(--primary)] rounded-full hover:bg-blue-50 transition-all shadow-lg flex items-center gap-3"
              >
                Xem chi tiết toàn bộ tính năng
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            <div className="max-w-4xl mx-auto bg-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="hidden sm:block">
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">
                    Cấu hình đã chọn
                  </p>
                  <p className="text-lg font-bold">
                    {selectedModules.length} Module hoạt động
                  </p>
                </div>
                <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">
                    Giá dự kiến
                  </p>
                  <p className="text-2xl font-extrabold text-blue-400">
                    {price.toLocaleString('vi-VN')} ₫/tháng
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/register', { state: { moduleIds: selectedModules } })}
                className="w-full sm:w-auto px-10 py-4 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
              >
                Bắt đầu dùng thử
              </button>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-12 bg-white">
          <div>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                Tại sao chọn DODO ?
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-[var(--bg-light)] p-10 rounded-3xl shadow-sm border border-gray-100">
                <div className="size-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">
                    shield_lock
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4">Bảo mật tuyệt đối</h3>
                <p className="text-[var(--text-muted)] font-inter leading-relaxed">
                  Dữ liệu được mã hóa và lưu trữ an toàn trên nền tảng.
                </p>
              </div>
              <div className="bg-[var(--bg-light)] p-10 rounded-3xl shadow-sm border border-gray-100">
                <div className="size-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">
                    sync
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4">
                  Đồng bộ thời gian thực
                </h3>
                <p className="text-[var(--text-muted)] font-inter leading-relaxed">
                  Thông tin luôn cập nhật tức thì giữa các phòng ban, loại bỏ
                  sai sót dữ liệu.
                </p>
              </div>
              <div className="bg-[var(--bg-light)] p-10 rounded-3xl shadow-sm border border-gray-100">
                <div className="size-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-3xl">
                    extension
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4">Linh hoạt mở rộng</h3>
                <p className="text-[var(--text-muted)] font-inter leading-relaxed">
                  Chỉ trả phí cho những module bạn thực sự cần, dễ dàng nâng cấp
                  khi cần.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 lg:px-12">
          <div>
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-[var(--primary-dark)] rounded-[2rem] p-12 md:p-20 text-center text-white shadow-2xl">
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">
                  Sẵn sàng tối ưu hóa quy trình{" "}
                  <br className="hidden md:block" />
                  kinh doanh của bạn?
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="px-10 py-5 text-lg font-bold bg-white text-[var(--primary)] rounded-full hover:bg-blue-50 transition-all shadow-lg">
                    Dùng thử miễn phí 14 ngày
                  </button>
                  <button className="px-10 py-5 text-lg font-bold border-2 border-white/30 text-white rounded-full hover:bg-white/10 transition-all">
                    Liên hệ tư vấn
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 size-96 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 size-96 bg-blue-400/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center justify-center size-8 bg-[var(--primary)] rounded-lg text-white">
                  <span className="material-symbols-outlined text-xl">
                    deployed_code
                  </span>
                </div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  DODO
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed font-inter">
                Giải pháp quản trị doanh nghiệp SME toàn diện trên nền tảng.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">
                Sản phẩm
              </h4>
              <ul className="space-y-4 text-sm font-inter text-[var(--text-muted)]">
                <li>
                  <a
                    className="hover:text-[var(--primary)] transition-colors"
                    href="#"
                  >
                    Tính năng chính
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-[var(--primary)] transition-colors"
                    href="#"
                  >
                    Tích hợp API
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-[var(--primary)] transition-colors"
                    href="#"
                  >
                    Bảo mật dữ liệu
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">
                Hỗ trợ
              </h4>
              <ul className="space-y-4 text-sm font-inter text-[var(--text-muted)]">
                <li>
                  <a
                    className="hover:text-[var(--primary)] transition-colors"
                    href="#"
                  >
                    Trung tâm trợ giúp
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-[var(--primary)] transition-colors"
                    href="#"
                  >
                    Tài liệu hướng dẫn
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-[var(--primary)] transition-colors"
                    href="#"
                  >
                    Cộng đồng
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">
                Pháp lý
              </h4>
              <ul className="space-y-4 text-sm font-inter text-[var(--text-muted)]">
                <li>
                  <a
                    className="hover:text-[var(--primary)] transition-colors"
                    href="#"
                  >
                    Điều khoản dịch vụ
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-[var(--primary)] transition-colors"
                    href="#"
                  >
                    Chính sách bảo mật
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-[var(--primary)] transition-colors"
                    href="#"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[var(--text-muted)] font-inter">
              © 2024 DODO System. All rights reserved.
            </p>
            {/* <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 grayscale opacity-50">
                <span className="text-[10px] font-bold uppercase tracking-widest">Tech Stack:</span>
                <span className="text-xs font-semibold">Node.js</span>
                <span className="text-xs font-semibold">PostgreSQL</span>
                <span className="text-xs font-semibold">React</span>
              </div>
            </div> */}
          </div>
        </div>
      </footer>
      {isModalOpen && <ModuleModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
