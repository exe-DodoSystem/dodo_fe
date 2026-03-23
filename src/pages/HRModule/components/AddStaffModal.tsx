import { useState } from "react";
import "./AddStaffModal.css";

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [position, setPosition] = useState("");
    const [department, setDepartment] = useState("");
    const [status, setStatus] = useState("Active");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validation is handled by HTML5 'required' and radio selection
        console.log({ fullName, email, position, department, status });
        alert("Thêm nhân viên thành công!");
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Thêm nhân viên mới</h2>
                    <button className="close-btn" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-desc">
                        Điền thông tin chi tiết để tạo hồ sơ nhân viên mới trong hệ thống.
                    </p>

                    <form onSubmit={handleSubmit} className="employee-form">
                        <div className="form-section-title">
                            <span className="material-symbols-outlined">person_add</span>
                            Thông tin cơ bản
                        </div>

                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div className="input-wrapper">
                                <span className="material-symbols-outlined input-icon">person</span>
                                <input
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-wrapper">
                                <span className="material-symbols-outlined input-icon">mail</span>
                                <input
                                    type="email"
                                    placeholder="employee@dodo.saas"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Position</label>
                                <div className="input-wrapper">
                                    <span className="material-symbols-outlined input-icon">work</span>
                                    <input
                                        type="text"
                                        placeholder="Product Designer"
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        className="form-input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <div className="input-wrapper">
                                    <span className="material-symbols-outlined input-icon">domain</span>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="form-select"
                                        required
                                    >
                                        <option value="" disabled>Select Department</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="HR">HR</option>
                                        <option value="Design">Design</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Sales">Sales</option>
                                    </select>
                                    <span className="material-symbols-outlined select-arrow">expand_more</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="Active"
                                        checked={status === "Active"}
                                        onChange={(e) => setStatus(e.target.value)}
                                    />
                                    <span className="radio-custom active-dot"></span>
                                    Active
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="Onboarding"
                                        checked={status === "Onboarding"}
                                        onChange={(e) => setStatus(e.target.value)}
                                    />
                                    <span className="radio-custom onboarding-dot"></span>
                                    Onboarding
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="status"
                                        value="Inactive"
                                        checked={status === "Inactive"}
                                        onChange={(e) => setStatus(e.target.value)}
                                    />
                                    <span className="radio-custom inactive-dot"></span>
                                    Inactive
                                </label>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-submit">
                                <span className="material-symbols-outlined">save</span>
                                Save Employee
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}