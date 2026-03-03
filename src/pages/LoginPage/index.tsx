import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

interface LoginPageProps {
  onNavigateHome: () => void;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-page min-h-screen w-full flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="w-full bg-white h-20 flex items-center justify-between px-8 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          {/* Logo SVG */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#1d6ced" />
            <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#1d6ced" />
            <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#1d6ced" />
          </svg>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            DODO
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#"
            className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors"
          >
            Sản phẩm
          </a>
          <a
            href="#"
            className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors"
          >
            Giải pháp
          </a>
          <a
            href="#"
            className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors"
          >
            Bảng giá
          </a>
          <a
            href="#"
            className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors"
          >
            Tài nguyên
          </a>
        </nav>

        <button className="px-6 py-2.5 text-sm font-bold bg-slate-100 text-slate-800 rounded-full hover:bg-slate-200 transition-colors">
          Dùng thử miễn phí
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="login-card bg-white rounded-[2rem] w-full max-w-md p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-600 mb-3">
              Đăng nhập vào DODO
            </h1>
            <p className="text-slate-500 text-sm font-inter">
              Hệ thống quản trị doanh nghiệp toàn diện
            </p>
          </div>

<form className="space-y-6 text-left" onSubmit={(e) => e.preventDefault()}>
  <div className="text-left">
    <label className="block text-sm font-semibold text-slate-800 mb-2">
      Email
    </label>
    <input
      type="email"
      placeholder="Nhập email của bạn"
      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-inter text-sm"
    />
  </div>

  <div className="text-left">
    <label className="block text-sm font-semibold text-slate-800 mb-2">
      Mật khẩu
    </label>

    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder="Nhập mật khẩu"
        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-inter text-sm pr-12"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className="material-symbols-outlined text-xl">
          {showPassword ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  </div>

            <div className="flex justify-end pt-1">
              <a
                href="#"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 mt-2 text-base">
              Đăng nhập
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-slate-500 font-inter">
              Chưa có tài khoản?{" "}
              <a
                href="#"
                className="font-bold text-blue-600 hover:text-blue-700 ml-1 transition-colors"
              >
                Đăng ký dùng thử miễn phí
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-100 py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#1d6ced" />
            <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#1d6ced" />
            <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#1d6ced" />
          </svg>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            DODO
          </span>
        </div>

        <div className="flex items-center gap-8">
          <a
            href="#"
            className="text-sm text-slate-500 hover:text-blue-600 font-inter transition-colors"
          >
            Chính sách bảo mật
          </a>
          <a
            href="#"
            className="text-sm text-slate-500 hover:text-blue-600 font-inter transition-colors"
          >
            Điều khoản sử dụng
          </a>
          <a
            href="#"
            className="text-sm text-slate-500 hover:text-blue-600 font-inter transition-colors"
          >
            Liên hệ
          </a>
        </div>

        <div className="text-sm text-slate-500 font-inter">
          © 2026 DODO Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
