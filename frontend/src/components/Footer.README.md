# Component Footer - Documentation

## Component Overview

**File:** `src/components/Footer.jsx`  
**Lines of Code:** 13  
**Type:** Presentational Component (Static)

## Description

Footer component hiển thị thông tin footer chuẩn cho toàn bộ website, bao gồm copyright, thông tin nhóm phát triển và thông báo bản quyền.

## Props

Không có props - component hoàn toàn static.

## Features

✅ **Static content** - Không cần state management  
✅ **Reusable** - Sử dụng cho tất cả các pages  
✅ **Consistent** - Đảm bảo footer nhất quán trên toàn site  
✅ **Maintainable** - Chỉ cần cập nhật 1 file để thay đổi footer toàn site

## Usage

```javascript
import Footer from '../../components/Footer';

function MyPage() {
  return (
    <div>
      {/* Page content */}
      <Footer />
    </div>
  );
}
```

## Content Structure

```
┌─────────────────────────────────────────┐
│  Copyright © 2025 Online Tutor.         │
│  Developed by Group 09, TDTU.           │
│  Reproduction or distribution without   │
│  permission is prohibited.              │
└─────────────────────────────────────────┘
```

## Styling

Component sử dụng CSS class `.footer` từ `HomePage.css`.

```css
.footer {
  /* Styling từ HomePage.css */
}
```

## Implementation

```jsx
const Footer = () => {
  return (
    <footer className="footer">
      <p>
        Copyright © 2025 Online Tutor. Developed by
        <button className="invisible-btn"> Group 09, TDTU</button>.<br />
        Reproduction or distribution without permission is prohibited.
      </p>
    </footer>
  );
};

export default Footer;
```

## Benefits

1. **DRY Principle** - Tránh lặp code footer trên mỗi page
2. **Easy Updates** - Cập nhật copyright/info chỉ cần sửa 1 file
3. **Consistency** - Footer giống nhau trên tất cả pages
4. **Clean Code** - Pages code ngắn gọn, dễ đọc hơn

## Used In

- ✅ `Homepage.jsx`
- ✅ `HomePage_Student.jsx`
- 🔄 Có thể sử dụng cho các pages khác

## Future Enhancements

Có thể mở rộng để nhận props nếu cần customize:

```javascript
// Example future enhancement
const Footer = ({ year = 2025, team = "Group 09, TDTU" }) => {
  return (
    <footer className="footer">
      <p>
        Copyright © {year} Online Tutor. Developed by
        <button className="invisible-btn"> {team}</button>.<br />
        Reproduction or distribution without permission is prohibited.
      </p>
    </footer>
  );
};
```

## Related Components

- `Header.jsx` - Header component tương ứng
- Used together để tạo layout hoàn chỉnh cho pages
