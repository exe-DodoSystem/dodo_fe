import { useState, useRef } from "react";
import "./AddCustomerModal.css";

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert("Vui lòng nhập tên khách hàng.");
            return;
        }
        console.log({ name, email, phone, notes });
        alert("Lưu thông tin thành công!");
        onClose();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            alert(`Đã chọn file: ${file.name}`);
            // Logic to process excel file would go here
        }
    };

    return (
        <div className="crm-modal-overlay" onClick={onClose}>
            <div className="crm-modal-container" onClick={(e) => e.stopPropagation()}>
                
                <div className="crm-modal-header">
                    <div className="crm-modal-title">
                        <div className="crm-title-icon">
                            <span className="material-symbols-outlined">person_add</span>
                        </div>
                        <h2>Thông tin chi tiết</h2>
                    </div>
                    <div className="crm-modal-header-actions">
                        <button className="crm-import-btn" onClick={handleImportClick} type="button">
                            <span className="material-symbols-outlined">upload_file</span>
                            Import Excel
                        </button>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <button className="crm-close-btn" onClick={onClose} type="button">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                <div className="crm-modal-body">
                    <form onSubmit={handleSubmit} className="crm-customer-form">
                        
                        <div className="crm-form-group">
                            <label className="crm-form-label">
                                Tên khách hàng <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ví dụ: Nguyễn Văn A"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="crm-form-input"
                                required
                            />
                        </div>

                        <div className="crm-form-row">
                            <div className="crm-form-group">
                                <label className="crm-form-label">Email</label>
                                <div className="crm-input-wrapper">
                                    <span className="material-symbols-outlined crm-input-icon">mail</span>
                                    <input
                                        type="email"
                                        placeholder="customer@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="crm-form-input with-icon"
                                    />
                                </div>
                            </div>

                            <div className="crm-form-group">
                                <label className="crm-form-label">Số điện thoại</label>
                                <div className="crm-input-wrapper">
                                    <span className="material-symbols-outlined crm-input-icon">call</span>
                                    <input
                                        type="tel"
                                        placeholder="09xx xxx xxx"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="crm-form-input with-icon"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="crm-form-group">
                            <label className="crm-form-label">Ghi chú</label>
                            <textarea
                                placeholder="Thêm các thông tin bổ sung về khách hàng..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="crm-form-textarea"
                                rows={4}
                            />
                        </div>

                        <div className="crm-modal-footer">
                            <button type="button" className="crm-btn-cancel" onClick={onClose}>
                                Hủy bỏ
                            </button>
                            <button type="submit" className="crm-btn-submit">
                                <span className="material-symbols-outlined">save</span>
                                Lưu thông tin
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
