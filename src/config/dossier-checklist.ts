export const DOSSIER_CHECKLIST = [
    {
        category: '1. Hồ sơ Pháp lý (Legal Documents)',
        items: [
            { id: 'legal_license', label: 'Giấy chứng nhận đăng ký kinh doanh (Business License)', required: true },
            { id: 'legal_tax', label: 'Giấy đăng ký thuế (Tax Registration)', required: true },
            { id: 'legal_rep', label: 'Quyết định bổ nhiệm người đại diện (Appointment Decision)', required: false },
        ]
    },
    {
        category: '2. Hệ thống Quản lý (Quality Management System)',
        items: [
            { id: 'qm_manual', label: 'Sổ tay chất lượng (Quality Manual)', required: true },
            { id: 'qm_policy', label: 'Chính sách & Mục tiêu chất lượng (Quality Policy & Objectives)', required: true },
            { id: 'qm_chart', label: 'Sơ đồ tổ chức (Org Chart)', required: true },
            { id: 'qm_procedures', label: 'Danh mục các quy trình (List of Procedures)', required: true },
        ]
    },
    {
        category: '3. Hồ sơ Kỹ thuật (Technical Documents)',
        items: [
            { id: 'tech_specs', label: 'Tiêu chuẩn kỹ thuật sản phẩm (Product Technical Specs)', required: true },
            { id: 'tech_drawings', label: 'Bản vẽ kỹ thuật/Sơ đồ (Technical Drawings/Diagrams)', required: true },
            { id: 'tech_test_reports', label: 'Phiếu kết quả thử nghiệm (Test Reports)', required: true },
            { id: 'tech_process', label: 'Quy trình sản xuất/kiểm soát (Production/QC Process)', required: true },
        ]
    }
]
