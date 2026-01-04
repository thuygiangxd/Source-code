# Component Refactoring

## Tổng quan
Đã tách các chức năng chung giữa `Homepage.jsx` và `HomePage_Student.jsx` thành các component riêng biệt để tái sử dụng và dễ bảo trì.

## Cấu trúc Component Mới

### 1. **BannerCarousel.jsx** (57 dòng)
- Quản lý carousel banner với auto-play
- Props: `banners` (array of banner images)
- Features:
  - Auto-play với interval 5 giây
  - Pause on hover
  - Thumbnail navigation

### 2. **CourseCatalog.jsx** (201 dòng)  
- Hiển thị danh mục khóa học với sidebar và panel chi tiết
- Props: `banners` (for integrated banner carousel)
- Features:
  - Hover-activated course panels
  - Các khóa học: Đại học, HSG, LTDH, THPT, vào 10, THCS, Tiểu học, Ngoại ngữ
  - Responsive sidebar navigation

### 3. **TutorSection.jsx** (32 dòng)
- Hiển thị danh sách gia sư tiêu biểu
- Props: `tutors` (array of tutor objects)
- Tutor object structure:
  ```javascript
  {
    name: string,
    subject: string,
    image: ImageSource,
    highlights: string[],
    location: string
  }
  ```

### 4. **TrialForm.jsx** (281 dòng)
- Form đăng ký học thử miễn phí
- Features:
  - Chọn môn học, lớp, hình thức (Online/Offline)
  - Date & time slot picker (7 ngày tới)
  - Form validation
  - Standalone state management

### 5. **RequestForm.jsx** (258 dòng)
- Form yêu cầu tìm gia sư
- Features:
  - Input fields: tên, SĐT, môn học, khối/lớp, khu vực, ngân sách
  - Date & time picker
  - Toast notification
  - Standalone state management

### 6. **FeaturesSection.jsx** (46 dòng)
- Hiển thị 6 tính năng nổi bật của dịch vụ
- Static content component
- Features:
  - Kèm 1-1 theo mục tiêu
  - Gia sư chất lượng
  - Theo dõi tiến độ
  - Lịch học linh hoạt
  - Bám sát chương trình
  - Cam kết phù hợp

### 7. **Footer.jsx** (12 dòng)
- Component footer chuẩn cho toàn bộ website
- Static content component
- Displays:
  - Copyright information
  - Development team credit (Group 09, TDTU)
  - Reproduction notice

## So sánh Before/After

### Before
- `Homepage.jsx`: ~1082 dòng
- `HomePage_Student.jsx`: ~1002 dòng
- **Tổng: ~2084 dòng** với nhiều code trùng lặp

### After  
- `Homepage.jsx`: **191 dòng** (-82%)
- `HomePage_Student.jsx`: **248 dòng** (-75%)
- Shared components: **922 dòng**
- **Tổng: 1361 dòng** (-35% tổng code)

## Lợi ích

1. **DRY (Don't Repeat Yourself)**: Loại bỏ code trùng lặp
2. **Maintainability**: Dễ sửa đổi, chỉ cần sửa 1 component
3. **Reusability**: Có thể tái sử dụng cho các pages khác
4. **Testability**: Dễ test từng component riêng lẻ
5. **Readability**: Code ngắn gọn, dễ đọc hơn
6. **Scalability**: Dễ mở rộng thêm tính năng mới

## Sử dụng

### Homepage.jsx / HomePage_Student.jsx
```javascript
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CourseCatalog from '../../components/CourseCatalog';
import TutorSection from '../../components/TutorSection';
import TrialForm from '../../components/TrialForm';
import RequestForm from '../../components/RequestForm';
import FeaturesSection from '../../components/FeaturesSection';
import BannerCarousel from '../../components/BannerCarousel';

// Prepare data
const banners = [Banner1, Banner2, Banner3, Banner4];
const tutors = [...tutorData];

// Use in JSX
<Header />
<CourseCatalog banners={banners} />
<TutorSection tutors={tutors} />
<TrialForm />
<RequestForm />
<FeaturesSection />
<BannerCarousel banners={banners} />
<Footer />
```

## Notes

- Tất cả components đều self-contained với state riêng
- Styling vẫn sử dụng CSS classes từ `HomePage.css`
- Components có thể được customize thêm props nếu cần
