# Dockerization Tasks

- [x] Create Dockerfile with node:20-alpine, postgresql-client, dependencies, prisma generate, build, exposed port 3000, and docker-entrypoint.sh
- [x] Create docker-entrypoint.sh to wait for PostgreSQL, run database push and seed, and start the Next.js server
- [x] Create docker-compose.yml with `db` and `web` services and environment variables
- [x] Run `docker-compose up --build -d` to launch the application
- [x] Verify that containers are running and database migration/seeding succeeded by viewing container logs

# Refactoring & Impersonation Tasks

- [x] NextAuth Session Impersonation integration in `src/lib/auth.ts`
- [x] Extend JWT and Session types in `src/types/next-auth.d.ts`
- [x] Create Impersonation API Routes (`/api/admin/impersonate` and `/api/admin/impersonate/stop`)
- [x] Create Impersonate UI Button component
- [x] Modify User Admin API (`/api/admin/users/[id]`) to support wallet credits adjustment
- [x] Update Admin User Lists Page to show wallet credits column and impersonation actions
- [x] Update Admin User Details Page to show and adjust credits and display impersonation button
- [x] Restrict student submissions page and API to INSTRUCTOR role only, and hide menu option for ADMIN role
- [x] Add prominent impersonation banner in both admin layout and main layout
- [x] Rebuild/restart Docker containers, and test
- [x] Loại bỏ các từ khóa mang tính chất chỉ tập trung vào lập trình/coding như "học lập trình", "lập trình viên" trên toàn bộ trang chủ, trang khóa học và trang lộ trình để mở rộng thành nền tảng đào tạo đa ngành nghề, tập trung vào kỹ năng thực chiến và cơ hội sự nghiệp rộng mở.

---

## 7. Cải tiến Nâng cấp Giảng viên & Tính năng Quản trị Đăng ký (Instructor Upgrade Policy & Admin Overrides)

Chúng ta đã hoàn thiện toàn diện cơ chế hoạt động của tài khoản Giảng viên từ lúc đăng ký đến lúc duy trì gia hạn, đảm bảo tính minh bạch tài chính tối đa cho người dùng và khả năng can thiệp/ghi đè của Quản trị viên (Admin).

### A. Minh bạch Tài chính khi Đăng ký & Hồ sơ cá nhân:
1. **Trang ứng tuyển Giảng viên**:
   - Khi học viên truy cập trang cá nhân `/profile` và muốn đăng ký nâng cấp, biểu mẫu `InstructorApplicationForm` hiện đã hiển thị một **Bảng chính sách tài chính Glassmorphism** nổi bật.
   - Bảng này thông báo rõ ràng cho học viên về:
     - Phí duy trì tài khoản giảng viên hàng tháng (ví dụ: `200 credit / 30 ngày`, miễn phí 30 ngày đầu).
     - Tỷ lệ phân chia doanh thu (Giảng viên giữ `70%` doanh thu bán khóa học, hệ thống/Admin nhận phí vận hành `30%`).
2. **Trang thông tin Thành viên Giảng viên**:
   - Sau khi được nâng cấp lên Giảng viên, trang hồ sơ hiển thị bảng duy trì đăng ký `InstructorSubscriptionPanel` được tích hợp thêm thông tin tỷ lệ chia sẻ doanh thu thực tế, nhắc nhở giảng viên về cơ chế phân phối doanh thu của họ.

### B. Quyền can thiệp & Ghi đè của Admin:
1. **API Quản trị `/api/admin/users/[id]`**:
   - Mở rộng endpoint để trả về và lưu trữ các trường dữ liệu `instructorActive` (trạng thái kích hoạt của giảng viên) và `instructorExpiresAt` (ngày hết hạn tài khoản giảng viên).
2. **Trang Chỉnh sửa người dùng `/admin/users/[id]`**:
   - Khi Admin chỉnh sửa một người dùng có vai trò là `INSTRUCTOR` (hoặc chuyển đổi vai trò thành `INSTRUCTOR`), hệ thống sẽ hiển thị thêm một bảng cài đặt riêng biệt:
     - Checkbox bật/tắt kích hoạt trạng thái hoạt động giảng viên (`instructorActive`).
     - Lựa chọn lịch hết hạn đăng ký (`instructorExpiresAt`) bằng ô chọn ngày trực quan.
   - Giúp Admin có thể gia hạn thủ công, hủy quyền đăng khóa học tạm thời, hoặc tặng thêm thời gian hoạt động cho giảng viên mà không cần can thiệp trực tiếp vào cơ sở dữ liệu.

### C. Hướng dẫn các bước Kiểm thử thực tế:
1. **Kiểm tra Học viên đăng ký**:
   - Đăng nhập tài khoản Học viên: `student@bawuiacademy.vn` / mật khẩu `student123`.
   - Truy cập **[http://localhost:3002/profile](http://localhost:3002/profile)**.
   - Xác nhận sự xuất hiện của bảng giải thích quyền lợi & chi phí duy trì màu xanh dương cao cấp.
2. **Kiểm tra Admin điều chỉnh tài khoản Giảng viên**:
   - Đăng nhập tài khoản Admin: `admin@bawuiacademy.vn` / mật khẩu `admin123456`.
   - Đi tới mục **Quản lý người dùng** -> chọn chỉnh sửa giảng viên *Sơn Nguyễn* (hoặc truy cập trực tiếp **[http://localhost:3002/admin/users/cldb-inst1-id-placeholder](http://localhost:3002/admin/users/)** và click Pencil).
   - Xác nhận có thêm mục **Cài đặt Thành viên Giảng viên** có thể tùy chỉnh hộp kiểm và ngày hết hạn. Thử chỉnh sửa ngày hết hạn và nhấn lưu.
   - Sử dụng tính năng giả lập (Impersonate) để truy cập tài khoản *Sơn Nguyễn*, vào trang `/profile` để xác nhận hạn đăng ký hiển thị đã được cập nhật chuẩn xác.

# Cải tiến Giao diện Tạo/Chỉnh sửa Bài học & Bài tập tự luận & Trắc nghiệm

- [x] Tạo API upload file nội bộ (`/api/admin/upload`) lưu vào `public/uploads` hỗ trợ tải lên tài liệu lý thuyết bài học
- [x] Nâng cấp schema và API thêm bài học (`/api/admin/sessions/[sessionId]/lessons`) hỗ trợ liên kết các tài liệu bổ sung (`LessonResource`) và bài tập tự luận (`Assignment`) lúc tạo bài học
- [x] Nâng cấp API cập nhật tài liệu bổ sung (`PUT`, `DELETE` tại `/api/admin/lessons/[lessonId]/resources`)
- [x] Thiết kế lại trang Tạo bài học mới (`new/page.tsx`) & Chỉnh sửa bài học (`[lessonId]/page.tsx`):
  - Hỗ trợ tải lên tài liệu đính kèm trực quan bằng component Drag-and-Drop và danh sách tập tin
  - Hỗ trợ giao bài tập tự luận trực tiếp khi tạo bài học bằng Checkbox "Giao bài tập tự luận về nhà"
  - Tích hợp tính năng **Import/Export câu hỏi trắc nghiệm** hỗ trợ định dạng **JSON** và **CSV** (có UTF-8 BOM hiển thị tiếng Việt chuẩn xác trên Microsoft Excel)
- [x] Redesign giao diện trang học viên (`[lessonId]/page.tsx` học tập):
  - Hiển thị danh sách tài liệu đính kèm dạng Card tóm tắt kèm biểu tượng loại file và nút tải về trực quan
  - Nâng cấp khung trả lời bài tập tự luận với giao diện chuyên nghiệp, ghi nhận tiến trình chấm bài và phản hồi của giáo viên
