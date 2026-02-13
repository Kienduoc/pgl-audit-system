# Bảng Phân Quyền Chi Tiết Hệ Thống PGL Audit (Detailed Permission Matrix)

Tài liệu này định nghĩa chi tiết quyền hạn truy cập và hiển thị tính năng cho từng vai trò người dùng trong hệ thống.

## 1. Định Nghĩa Vai Trò (Roles)

- **Client (Khách Hàng)**: Doanh nghiệp đăng ký chứng nhận.
- **Auditor (Đánh Giá Viên)**: Chuyên gia đánh giá hiện trường.
- **Lead Auditor (Trưởng Đoàn)**: Chuyên gia trưởng đoàn đánh giá, chịu trách nhiệm chính. Họ chỉ có vai trò trong từng cuộc đánh giá. Còn bản chất họ vẫn là Auditor.
- **Admin (Quản Trị Viên)**: Quản lý hệ thống, người dùng, và quy trình.

---

## 2. Bảng Phân Quyền Chi Tiết (Feature Matrix)

| **Khu Vực (Module)**     | **Tính Năng / Trang**             | **Client (Khách Hàng)** | **Auditor (Đánh Giá Viên)** | **Lead Auditor (Trưởng Đoàn)** |             **Admin (Quản Trị Viên)**             | **Ghi Chú Logic**                                                                                                                                                                                             |
| :------------------------------ | :---------------------------------------- | :-----------------------------: | :-----------------------------------: | :--------------------------------------: | :--------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tổng Quan**            | **Xem Dashboard Chung**             |      ❌ (Redirect Profile)      |         ❌ (Redirect Audits)         |       ⚠️ (Chỉ xem dự án team)       |                      ✅ Xem Toàn Bộ                      | Auditor không cần xem biểu đồ thống kê hệ thống.                                                                                                                                                            |
| (`/`)                         | **Xem Thống Kê Cá Nhân**        |        ✅ (Tại Profile)        |                  ✅                  |                    ✅                    |                             ✅                             | Client xem tại Profile Dashboard.Auditor, lead chỉ xem được những gì liên quan đến chương trình của mình<br />Admin xem được toàn bộ                                                             |
| **Điều Hướng**        | **Menu "Tổng Quan"**               |               ❌               |                  ❌                  |                    ✅                    |                             ✅                             |                                                                                                                                                                                                                      |
| (Sidebar)                       | **Menu "Chương Trình ĐG"**      |               ✅               |               ❌ (Ẩn)               |                    ✅                    |                             ✅                             | Auditor không tham gia giai đoạn đăng ký.                                                                                                                                                                      |
|                                 | **Menu "Quản Lý Đánh Giá"**    |               ✅               |                  ✅                  |                    ✅                    |                             ✅                             |                                                                                                                                                                                                                      |
|                                 | **Menu "Hồ Sơ (Profile)"**        |               ✅               |                  ✅                  |                    ✅                    | ⚠️ (Quản lý danh sách Profile của Client và Auditor | Admin quản lý user qua menu "Users", nhưng cũng cân phân tách ra Client và Auditor (Theo dõi được năng lực, để list ra những người có khả năng làm Lead Auditor) để lựa chọn khi cần.)). |
| **Chương Trình ĐG**   | **Xem Danh Sách**                  |         ✅ (Của mình)         |                  ❌                  |         ✅ (Được phân công)         |                       ✅ (Toàn bộ)                       |                                                                                                                                                                                                                      |
| (`/audit-programs`)           | **Tạo Mới Đơn Đăng Ký**      |               ✅               |                  ❌                  |                    ❌                    |                             ✅                             | Chỉ Client hoặc Admin tạo yêu cầu mới.                                                                                                                                                                         |
|                                 | **Xét Duyệt / Phê Duyệt**       |               ❌               |                  ❌                  |               ✅ (Review)               |                        ✅ (Approve)                        | Lead Auditor chỉ Review được khi đã được Admin Approve và add vào Audit team.                                                                                                                             |
| **Quản Lý Đánh Giá** | **Xem Danh Sách (`/audits`)**    |         ✅ (Của mình)         |       ✅ (Được phân công)       |         ✅ (Được phân công)         |                       ✅ (Toàn bộ)                       |                                                                                                                                                                                                                      |
| (`/audits/[id]`)              | **Tạo Đánh Giá Mới**           |               ❌               |                  ❌                  |                    ❌                    |                             ✅                             | Chỉ Admin mới có quyền tạo cuộc đánh giá chính thức, nó theo sau bước Approve, sau khi Approve thì auto là tạo cuộc đánh giá chính thức                                                       |
|                                 | **Xem Tổng Quan (Overview)**       |               ✅               |                  ✅                  |                    ✅                    |                             ✅                             |                                                                                                                                                                                                                      |
|                                 | **Checklist (Xem)**                 |               ✅               |                  ✅                  |                    ✅                    |                             ✅                             | Chỉ xem cuộc đánh giá của mình liên quan, Admin thì xem được toàn bộ.                                                                                                                                  |
|                                 | **Checklist (Chấm Điểm)**        |               ❌               |      ✅ (Chỉ mục được gán)      |              ✅ (Toàn bộ)              |                       ✅ (Toàn bộ)                       | Client chỉ xem kết quả (Read-only).                                                                                                                                                                               |
|                                 | **Phát Hiện (Findings)**          |            ✅ (Xem)            |            ✅ (Tạo/Sửa)            |           ✅ (Tạo/Sửa/Chốt)           |                 ✅ (Sửa/Chốt/Quản lý)                 | Auditor tạo NC, Lead chốt NC.                                                                                                                                                                                      |
|                                 | **Báo Cáo (Report)**              |          ✅ (Xem/Tải)          |          ✅ (Xem bản nháp)          |             ✅ (Tạo/Duyệt)             |                       ✅ (Quản lý)                       | Lead chịu trách nhiệm báo cáo cuối cùng.                                                                                                                                                                      |
| **Hồ Sơ & Cài Đặt**  | **Xem Hồ Sơ Công Ty**            |               ✅               |                  ✅                  |                    ✅                    |                             ✅                             | Thông tin pháp nhân, MST, địa chỉ nhà máy.                                                                                                                                                                   |
| (`/profile`)                  | **Sửa Hồ Sơ Công Ty**           |               ✅               |                  ❌                  |                    ❌                    |                             ✅                             |                                                                                                                                                                                                                      |
|                                 | **Hồ Sơ Năng Lực (Competence)** |               ❌               |       ✅ (Xem/Sửa của mình)       |         ✅ (Xem/Sửa của mình)         |                             ❌                             | Upload chứng chỉ, bằng cấp ISO.                                                                                                                                                                                  |
|                                 | **Cài Đặt Tài Khoản**          |               ✅               |                  ✅                  |                    ✅                    |                             ✅                             | Đổi mật khẩu, Avatar.                                                                                                                                                                                            |

---

## 3. Quy Tắc Truy Cập (Access Rules)

### 3.1. Dashboard Access

- **Client**: Tự động chuyển hướng về `/profile` (Client Dashboard).
- **Auditor**: Tự động chuyển hướng về `/audits`.
- **Lead Auditor / Admin**: Truy cập `/` (Admin Dashboard). Dữ liệu của Lead Auditor được lọc theo `audit_auditors` hoặc `lead_auditor_id`.

### 3.2. Profile Access

- **Client**: Truy cập `/profile` để xem thông tin doanh nghiệp. Không thấy tab "Năng Lực".
- **Auditor / Lead Auditor**: Truy cập `/profile` để xem tab "Năng Lực", "Kinh Nghiệm", "Nhật Ký". Không thấy thông tin doanh nghiệp.
- **Admin**: Truy cập `/profile` sẽ được chuyển hướng về `/admin/settings` hoặc trang quản trị tương đương.

### 3.3. Audit Actions

- **Client**: Không thể chỉnh sửa trạng thái đánh giá, chỉ xem tiến độ.
- **Auditor**: Chỉ có thể cập nhật Checklist và upload Evidence cho các phần được phân công.
- **Lead Auditor**: Có quyền thay đổi trạng thái đánh giá (Advance Phase: Planned -> Ongoing -> Reviewing).
