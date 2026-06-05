import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old database records...');

  // Delete records in reverse dependency order
  await prisma.transaction.deleteMany({});
  await prisma.creditWallet.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.videoNote.deleteMany({});
  await prisma.lessonProgress.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.blogPost.deleteMany({});
  await prisma.instructorApplication.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.roadmap.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleared.');
  console.log('Seeding database with rich sample data...');

  // 1. App settings
  await prisma.setting.createMany({
    data: [
      { key: 'CREDIT_PRICE_VND', value: '1000' },
      { key: 'MIN_TOPUP_CREDIT', value: '100' },
      { key: 'MAX_TOPUP_CREDIT', value: '10000' },
      { key: 'INSTRUCTOR_MONTHLY_FEE', value: '200' },
      { key: 'ADMIN_REVENUE_SHARE_PERCENT', value: '30' },
    ],
    skipDuplicates: true,
  });
  console.log('  App settings created.');

  // 2. Create Users
  // Helper to hash email + birthdate password
  const makePasswordHash = async (email: string, dobStr: string) => {
    return await hash(email + dobStr, 12);
  };

  const adminDob = new Date('1988-10-15');
  const adminDobStr = '15101988';
  const adminPasswordHash = await makePasswordHash('admin@bawuiacademy.vn', adminDobStr);

  const inst1Dob = new Date('1985-08-20');
  const inst1DobStr = '20081985';
  const inst1PasswordHash = await makePasswordHash('son.nguyen@bawuiacademy.vn', inst1DobStr);

  const inst2Dob = new Date('1989-03-12');
  const inst2DobStr = '12031989';
  const inst2PasswordHash = await makePasswordHash('ha.tran@bawuiacademy.vn', inst2DobStr);

  const inst3Dob = new Date('1992-05-05');
  const inst3DobStr = '05051992';
  const inst3PasswordHash = await makePasswordHash('duc.le@bawuiacademy.vn', inst3DobStr);

  const studDob = new Date('1998-05-30');
  const studDobStr = '30051998';
  const studPasswordHash = await makePasswordHash('student@bawuiacademy.vn', studDobStr);

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bawuiacademy.vn',
      name: 'Phạm Minh Quân (Admin)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      phone: '0901234567',
      dateOfBirth: adminDob,
      emailVerified: new Date(),
      wallet: { create: { balance: 0 } },
    },
  });

  // Instructors
  const instructor1 = await prisma.user.create({
    data: {
      email: 'son.nguyen@bawuiacademy.vn',
      name: 'Sơn Nguyễn (Frontend Lead)',
      passwordHash: inst1PasswordHash,
      role: 'INSTRUCTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      phone: '0912345678',
      dateOfBirth: inst1Dob,
      emailVerified: new Date(),
      instructorActive: true,
      instructorExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      wallet: { create: { balance: 1000 } },
    },
  });

  const instructor2 = await prisma.user.create({
    data: {
      email: 'ha.tran@bawuiacademy.vn',
      name: 'Hà Trần (System Architect)',
      passwordHash: inst2PasswordHash,
      role: 'INSTRUCTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
      phone: '0987654321',
      dateOfBirth: inst2Dob,
      emailVerified: new Date(),
      instructorActive: true,
      instructorExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      wallet: { create: { balance: 800 } },
    },
  });

  const instructor3 = await prisma.user.create({
    data: {
      email: 'duc.le@bawuiacademy.vn',
      name: 'Đức Lê (AI Specialist)',
      passwordHash: inst3PasswordHash,
      role: 'INSTRUCTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
      phone: '0933445566',
      dateOfBirth: inst3Dob,
      emailVerified: new Date(),
      instructorActive: true,
      instructorExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      wallet: { create: { balance: 1200 } },
    },
  });

  // Demo student
  const student = await prisma.user.create({
    data: {
      email: 'student@bawuiacademy.vn',
      name: 'Nguyễn Văn Học Viên',
      passwordHash: studPasswordHash,
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
      phone: '0944556677',
      dateOfBirth: studDob,
      emailVerified: new Date(),
      wallet: { create: { balance: 650 } },
    },
  });

  console.log('  Users created with phone numbers, dates of birth, and email+birthdate passwords.');

  // 3. Courses Definition
  const coursesData = [
    {
      title: 'ReactJS Masterclass: Từ Số 0 Đến Thực Chiến',
      slug: 'reactjs-masterclass',
      description: 'Học ReactJS chuyên sâu từ cơ bản đến nâng cao. Tự tay thiết kế, tối ưu hóa hiệu năng, triển khai các ứng dụng web phức tạp sử dụng Hooks, Context API và Redux Toolkit.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
      priceCredit: 100,
      isPublished: true,
      creatorId: instructor1.id,
      category: 'Web Development',
    },
    {
      title: 'Lập Trình Fullstack với Next.js & PostgreSQL',
      slug: 'nextjs-fullstack',
      description: 'Xây dựng ứng dụng web thương mại hoàn chỉnh với Next.js 15, App Router, React Server Components (RSC), Prisma ORM, và PostgreSQL. Hướng dẫn deploy lên Vercel và tối ưu SEO.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      priceCredit: 250,
      isPublished: true,
      creatorId: instructor1.id,
      category: 'Web Development',
    },
    {
      title: 'TypeScript Pro: Làm Chủ Hệ Thống Kiểu Tĩnh',
      slug: 'typescript-pro',
      description: 'Nâng tầm mã nguồn JavaScript của bạn với TypeScript. Tìm hiểu về Generics, Decorators, Utility Types và các pattern nâng cao để viết code sạch, an toàn và dễ bảo trì.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?auto=format&fit=crop&w=800&q=80',
      priceCredit: 80,
      isPublished: true,
      creatorId: instructor1.id,
      category: 'Software Engineering',
    },
    {
      title: 'Modern CSS & Tailwind CSS Masterclass',
      slug: 'tailwind-css-masterclass',
      description: 'Học cách thiết kế các giao diện tuyệt đẹp, responsive và động với CSS Grid, Flexbox và Tailwind CSS. Kết hợp các thư viện animation để tạo hiệu ứng ấn tượng nhất.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
      priceCredit: 50,
      isPublished: true,
      creatorId: instructor2.id,
      category: 'Web Development',
    },
    {
      title: 'Node.js Backend Architecture: Xây Dựng API Chuyên Nghiệp',
      slug: 'nodejs-backend-architecture',
      description: 'Thiết kế hệ thống backend mở rộng với Node.js, Express, NestJS và kiến trúc Microservices. Tìm hiểu cách thiết kế API RESTful, GraphQL, gRPC và tích hợp Redis cache.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      priceCredit: 150,
      isPublished: true,
      creatorId: instructor2.id,
      category: 'Backend Development',
    },
    {
      title: 'Python cho Khoa Học Dữ Liệu & AI',
      slug: 'python-data-science-ai',
      description: 'Bắt đầu hành trình trí tuệ nhân tạo của bạn với Python, NumPy, Pandas, Matplotlib và Scikit-Learn. Xây dựng các mô hình Machine Learning dự đoán thực tế.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      priceCredit: 120,
      isPublished: true,
      creatorId: instructor3.id,
      category: 'Data Science & AI',
    },
    {
      title: 'Lập Trình Golang & Xây Dựng Hệ Thế Phân Tán',
      slug: 'golang-distributed-systems',
      description: 'Học cú pháp Golang, concurrency patterns (goroutines, channels), và cách thiết kế các hệ thống phân tán, microservices chịu tải cao, siêu nhanh.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=800&q=80',
      priceCredit: 200,
      isPublished: true,
      creatorId: instructor2.id,
      category: 'Backend Development',
    },
    {
      title: 'UI/UX Design Essentials với Figma',
      slug: 'uiux-design-figma',
      description: 'Học cách tư duy thiết kế trải nghiệm người dùng (UX) và tạo ra các giao diện người dùng (UI) đẹp mắt, chuyên nghiệp từ wireframe đến prototype trên Figma.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=800&q=80',
      priceCredit: 90,
      isPublished: true,
      creatorId: instructor3.id,
      category: 'UI/UX Design',
    },
  ];

  const courses: any[] = [];
  for (const cData of coursesData) {
    const course = await prisma.course.create({
      data: cData,
    });
    courses.push(course);
  }
  console.log(`  Seeded ${courses.length} courses with realistic titles and Unsplash thumbnails.`);

  // 4. Add Content for Course 1: ReactJS Masterclass
  const rCourse = courses[0];
  
  const rs1 = await prisma.session.create({
    data: {
      courseId: rCourse.id,
      title: 'Chương 1: Giới thiệu & Cài đặt Môi trường',
      description: 'Học các kiến thức cơ bản về Single Page Application (SPA), React Core và cài đặt Node.js/Vite',
      orderIndex: 1,
    },
  });

  const rl1_1 = await prisma.lesson.create({
    data: {
      sessionId: rs1.id,
      title: '1. SPA vs Multi-Page App & Tại sao chọn React?',
      description: 'So sánh chi tiết SPA và MPA. Giới thiệu lịch sử, đặc trưng Virtual DOM của React.',
      videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
      videoType: 'YOUTUBE',
      duration: 520,
      orderIndex: 1,
      isFree: true,
    },
  });

  const rl1_2 = await prisma.lesson.create({
    data: {
      sessionId: rs1.id,
      title: '2. Khởi tạo dự án React cực nhanh với Vite',
      description: 'Hướng dẫn cài đặt Node.js, khởi tạo dự án React + TypeScript sử dụng Vite, cấu trúc thư mục.',
      videoUrl: 'https://www.youtube.com/watch?v=8JgElbTHn44',
      videoType: 'YOUTUBE',
      duration: 680,
      orderIndex: 2,
      isFree: true,
    },
  });

  const rs2 = await prisma.session.create({
    data: {
      courseId: rCourse.id,
      title: 'Chương 2: JSX & Components trong React',
      description: 'Cách viết JSX, cách truyền nhận Props, tái sử dụng các Component',
      orderIndex: 2,
    },
  });

  const rl2_1 = await prisma.lesson.create({
    data: {
      sessionId: rs2.id,
      title: '3. JSX là gì? Các quy tắc viết JSX chuẩn',
      description: 'Phân tích bản chất của JSX. Viết JSX, làm việc với biểu thức JavaScript trong JSX.',
      videoUrl: 'https://www.youtube.com/watch?v=9D1x7-2FmTA',
      videoType: 'YOUTUBE',
      duration: 600,
      orderIndex: 1,
    },
  });

  const rl2_2 = await prisma.lesson.create({
    data: {
      sessionId: rs2.id,
      title: '4. Component & Props - Tái sử dụng giao diện',
      description: 'Tạo Functional Component. Truyền dữ liệu từ component cha xuống con thông qua Props.',
      videoUrl: 'https://www.youtube.com/watch?v=9D1x7-2FmTA',
      videoType: 'YOUTUBE',
      duration: 750,
      orderIndex: 2,
      isGated: true,
    },
  });

  const rs3 = await prisma.session.create({
    data: {
      courseId: rCourse.id,
      title: 'Chương 3: State & React Hooks cơ bản',
      description: 'Tìm hiểu State của component, useState và useEffect để xử lý side-effects',
      orderIndex: 3,
    },
  });

  const rl3_1 = await prisma.lesson.create({
    data: {
      sessionId: rs3.id,
      title: '5. useState - Quản lý trạng thái Component',
      description: 'Tìm hiểu tại sao cần State. Cách khai báo, cập nhật state với useState.',
      videoUrl: 'https://www.youtube.com/watch?v=O6P86tEii6c',
      videoType: 'YOUTUBE',
      duration: 900,
      orderIndex: 1,
    },
  });

  const rl3_2 = await prisma.lesson.create({
    data: {
      sessionId: rs3.id,
      title: '6. useEffect - Xử lý Side Effects & Call API',
      description: 'Hiểu về vòng đời Component. Xử lý các tác vụ call API, event listener, cleanup function với useEffect.',
      videoUrl: 'https://www.youtube.com/watch?v=0ZJgIjIuY7U',
      videoType: 'YOUTUBE',
      duration: 1020,
      orderIndex: 2,
      isGated: true,
    },
  });

  // Quiz for React Course
  const rQuiz = await prisma.quiz.create({
    data: {
      courseId: rCourse.id,
      title: 'Đánh Giá Giữa Khóa: Khái Niệm ReactJS Cơ Bản',
      description: 'Kiểm tra mức độ nắm bắt kiến thức về JSX, Component, Props, và State Hooks.',
      quizType: 'MIDTERM',
      passScore: 60,
      duration: 20,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        quizId: rQuiz.id,
        text: 'Thành phần nào giúp React tối ưu việc re-render giao diện?',
        options: JSON.stringify([
          { label: 'A', text: 'Real DOM' },
          { label: 'B', text: 'Virtual DOM' },
          { label: 'C', text: 'Babel Compiler' },
          { label: 'D', text: 'Redux Store' },
        ]),
        correctAnswer: 'B',
        orderIndex: 1,
      },
      {
        quizId: rQuiz.id,
        text: 'Dữ liệu truyền từ Component cha xuống Component con được gọi là gì và có thể thay đổi ở Component con không?',
        options: JSON.stringify([
          { label: 'A', text: 'State, thay đổi được' },
          { label: 'B', text: 'Props, thay đổi được' },
          { label: 'C', text: 'Props, không thay đổi được (read-only)' },
          { label: 'D', text: 'State, không thay đổi được' },
        ]),
        correctAnswer: 'C',
        orderIndex: 2,
      },
      {
        quizId: rQuiz.id,
        text: 'Mảng dependencies rỗng [] truyền vào useEffect có ý nghĩa gì?',
        options: JSON.stringify([
          { label: 'A', text: 'Chạy useEffect sau mỗi lần component re-render' },
          { label: 'B', text: 'Chạy useEffect chỉ một lần sau khi component được mount' },
          { label: 'C', text: 'Không chạy useEffect nữa' },
          { label: 'D', text: 'Gây ra vòng lặp vô tận' },
        ]),
        correctAnswer: 'B',
        orderIndex: 3,
      },
    ],
  });

  // Assignment for React Course
  await prisma.assignment.create({
    data: {
      lessonId: rl2_2.id,
      title: 'Bài tập 1: Xây dựng Component UserProfile',
      description: 'Tạo Component `UserProfile` nhận các props `name`, `avatarUrl`, `role`, và hiển thị thẻ hồ sơ người dùng đẹp mắt.\n\nYêu cầu nộp bài:\n1. Upload mã nguồn lên GitHub.\n2. Submit URL repository tại đây.',
      isRequired: true,
    },
  });
  console.log('  Course 1: ReactJS Masterclass content seeded.');

  // 5. Add Content for Course 2: Next.js
  const nCourse = courses[1];

  const ns1 = await prisma.session.create({
    data: {
      courseId: nCourse.id,
      title: 'Chương 1: Khởi đầu với Next.js & App Router',
      description: 'Hiểu về triết lý phát triển của Next.js, Server Components và cấu trúc thư mục App Router.',
      orderIndex: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sessionId: ns1.id,
        title: '1. Next.js là gì? Tổng quan mô hình Rendering',
        description: 'Giải thích chi tiết SSR (Server Side Rendering), SSG (Static Site Generation), ISR (Incremental Static Regeneration) và CSR (Client Side Rendering).',
        videoUrl: 'https://www.youtube.com/watch?v=mTz0GXZ_7Yc',
        videoType: 'YOUTUBE',
        duration: 800,
        orderIndex: 1,
        isFree: true,
      },
      {
        sessionId: ns1.id,
        title: '2. Cơ chế Routing dựa trên File-system trong App Router',
        description: 'Học cách tạo Page, Layout, Nested routes, Dynamic routes trong thư mục app.',
        videoUrl: 'https://www.youtube.com/watch?v=ZVnjOPwG4bp',
        videoType: 'YOUTUBE',
        duration: 950,
        orderIndex: 2,
      },
      {
        sessionId: ns1.id,
        title: '3. React Server Components vs Client Components',
        description: 'Khi nào nên sử dụng Server Components, khi nào sử dụng Client Components. Lợi ích tối ưu dung lượng JS bundle.',
        videoUrl: 'https://www.youtube.com/watch?v=R4GMeG1llyQ',
        videoType: 'YOUTUBE',
        duration: 780,
        orderIndex: 3,
      },
    ],
  });
  console.log('  Course 2: Next.js content seeded.');

  // 6. Add Content for Course 3: TypeScript Pro
  const tCourse = courses[2];
  const ts1 = await prisma.session.create({
    data: {
      courseId: tCourse.id,
      title: 'Chương 1: TypeScript Fundamentals',
      description: 'Lý thuyết cơ bản về type system, basic types và cú pháp.',
      orderIndex: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sessionId: ts1.id,
        title: '1. Giới thiệu TypeScript & Cài đặt TSC',
        description: 'Tại sao cần TypeScript. Thiết lập trình biên dịch TSC và chạy file TS đầu tiên.',
        videoUrl: 'https://www.youtube.com/watch?v=gp5H0Vw39yw',
        videoType: 'YOUTUBE',
        duration: 480,
        orderIndex: 1,
        isFree: true,
      },
      {
        sessionId: ts1.id,
        title: '2. Các kiểu dữ liệu cơ bản & Type Inference',
        description: 'Khai báo kiểu cho string, number, array, tuple, enum. Cơ chế tự động suy luận kiểu dữ liệu.',
        videoUrl: 'https://www.youtube.com/watch?v=gp5H0Vw39yw',
        videoType: 'YOUTUBE',
        duration: 650,
        orderIndex: 2,
        isFree: true,
      },
    ],
  });
  console.log('  Course 3: TypeScript Pro content seeded.');

  // 7. Add content for remaining courses (minimal session/lesson to keep DB healthy and fast)
  for (let idx = 3; idx < courses.length; idx++) {
    const crs = courses[idx];
    const sess = await prisma.session.create({
      data: {
        courseId: crs.id,
        title: 'Chương 1: Nhập môn & Tổng quan',
        description: `Giới thiệu sơ lược về kiến thức cốt lõi của khóa học ${crs.title}`,
        orderIndex: 1,
      },
    });
    await prisma.lesson.create({
      data: {
        sessionId: sess.id,
        title: `1. Giới thiệu tổng quan về ${crs.title}`,
        description: `Nắm rõ mục tiêu đầu ra và phương pháp học khóa ${crs.title} hiệu quả nhất.`,
        videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
        videoType: 'YOUTUBE',
        duration: 450,
        orderIndex: 1,
        isFree: true,
      },
    });
  }
  console.log('  Course 4 - 8 content seeded.');

  // 8. Enroll Student in ReactJS Masterclass & Give progress
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: rCourse.id,
      progress: 33, // Completed 2 out of 6 lessons
    },
  });

  await prisma.lessonProgress.createMany({
    data: [
      {
        userId: student.id,
        lessonId: rl1_1.id,
        videoCompleted: true,
        completed: true,
        lastPosition: 520,
        completedAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
      },
      {
        userId: student.id,
        lessonId: rl1_2.id,
        videoCompleted: true,
        completed: true,
        lastPosition: 680,
        completedAt: new Date(Date.now() - 3600000 * 24 * 1), // 1 day ago
      },
    ],
  });

  await prisma.videoNote.createMany({
    data: [
      {
        userId: student.id,
        lessonId: rl1_1.id,
        timestamp: 120,
        content: 'SPA tải trang một lần duy nhất, sau đó chỉ cập nhật các phần giao diện thay đổi qua DOM API.',
      },
      {
        userId: student.id,
        lessonId: rl1_1.id,
        timestamp: 300,
        content: 'Virtual DOM giúp so sánh sự khác biệt (diffing) để hạn chế re-render trực tiếp lên Real DOM.',
      },
    ],
  });
  console.log('  Student enrolled in Course 1 with progress and notes.');

  // 9. Blog posts Seeding
  const blogData: any[] = [
    {
      title: 'Lộ trình học Web Frontend Developer năm 2026',
      slug: 'lo-trinh-frontend-developer-2026',
      excerpt: 'Bạn muốn trở thành lập trình viên Frontend chuyên nghiệp từ con số 0? Khám phá lộ trình học bài bản từ HTML/CSS đến React/Next.js năm 2026.',
      content: `### Giới thiệu
Thế giới Web phát triển vô cùng nhanh chóng. Để trở thành một Frontend Developer chuyên nghiệp vào năm 2026, bạn cần có một lộ trình học tập tập trung, chọn lọc và cập nhật liên tục các xu hướng công nghệ mới.

### Bước 1: Nền tảng cốt lõi (Core HTML, CSS, JavaScript)
Dù các framework có thay đổi thế nào, HTML5, CSS3 và JavaScript ES6+ vẫn luôn là nền móng vững chắc nhất. Bạn cần:
- Nắm vững Semantic HTML để tối ưu SEO và Accessibility.
- Thiết kế layout hiện đại với Flexbox và CSS Grid.
- Làm chủ bất đồng bộ (Promises, async/await), DOM manipulation, và ES Modules trong JavaScript.

### Bước 2: Tối ưu CSS với Tailwind CSS
Tailwind CSS hiện nay gần như là tiêu chuẩn công nghiệp nhờ tính linh hoạt, hiệu năng cao và tốc độ phát triển giao diện nhanh chóng. Hãy học cách kết cấu các Utility Class và tối ưu CSS bundle size.

### Bước 3: Framework JS (ReactJS & Next.js)
React vẫn giữ vững vị thế số 1. Tuy nhiên, thay vì chỉ học Client-Side React, bạn bắt buộc phải học Next.js để làm chủ cơ chế Server-side rendering (SSR), cải thiện SEO và hiệu năng vượt bậc.

### Bước 4: Kiểm thử và Triển khai (Git, Vercel)
- Học cách sử dụng Git/GitHub để quản lý mã nguồn.
- Deploy ứng dụng của bạn lên Vercel, Netlify hoặc Docker.

Chúc các bạn thành công trên con đường trở thành kỹ sư Frontend!`,
      coverUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
      category: 'Lộ Trình Học',
      status: 'PUBLISHED',
      isPublished: true,
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 3600000 * 24 * 5), // 5 days ago
    },
    {
      title: 'Tại sao React Server Components là tương lai của Web?',
      slug: 'tai-sao-rsc-la-tuong-lai-cua-web',
      excerpt: 'React Server Components (RSC) mang lại những đột phá lớn cho các ứng dụng web phức tạp. Khám phá lý do tại sao các lập trình viên nên sử dụng RSC.',
      content: `### React Server Components (RSC) là gì?
Được giới thiệu từ bản React 18 và tích hợp sâu sắc trong Next.js App Router, RSC cho phép các component React được render trực tiếp trên server. 

### Những lợi ích vượt trội của RSC:
1. **Giảm dung lượng JavaScript tải xuống client**: Các thư viện phục vụ cho việc parse Markdown, format Date, v.v. chỉ chạy trên server và không làm nặng trang web của người dùng.
2. **Bảo mật tối đa**: Bạn có thể query database hoặc gọi các API nội bộ chứa token bí mật trực tiếp ngay bên trong Component mà không sợ lộ mã nguồn ra client.
3. **Data Fetching hiệu quả**: Fetch dữ liệu gần nguồn cơ sở dữ liệu hơn, giảm thời gian phản hồi (round-trip time).
4. **Tối ưu SEO**: Giao diện được render hoàn chỉnh thành HTML trên server giúp các công cụ tìm kiếm cào dữ liệu dễ dàng hơn.

### Kết luận
RSC không thay thế hoàn toàn Client Components. Việc kết hợp hài hòa hai mô hình render này giúp chúng ta tạo ra các ứng dụng vừa cực nhanh, vừa tương tác cực kỳ sống động.`,
      coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      category: 'Công Nghệ',
      status: 'PUBLISHED',
      isPublished: true,
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 3600000 * 24 * 3), // 3 days ago
    },
    {
      title: '10 Mẹo Tối Ưu SEO Cho Ứng Dụng React Năm 2026',
      slug: '10-meo-toi-uu-seo-react-2026',
      excerpt: 'Ứng dụng Single Page App React thường gặp nhiều rào cản về SEO. Dưới đây là 10 giải pháp tối ưu SEO on-page chuẩn nhất hiện nay.',
      content: `SEO luôn là yếu tố sống còn của doanh nghiệp. Để các ứng dụng React của bạn xếp hạng cao trên Google, hãy áp dụng ngay các mẹo sau:

1. **Chuyển dịch sang SSR với Next.js** (Khuyên dùng).
2. **Sử dụng các thẻ Meta tiêu chuẩn**: Luôn điền Title, Description, Open Graph (og:image, og:title) hợp lý.
3. **Tạo cấu trúc Heading rõ ràng**: Sử dụng duy nhất một thẻ H1 cho mỗi trang.
4. **Cấu hình Sitemap.xml và Robots.txt tự động**.
5. **Thêm Structured Data (JSON-LD)** để hiển thị rich snippets nổi bật trên trang tìm kiếm Google.
6. **Lazy load hình ảnh**: Sử dụng Next/Image để tự động định dạng WebP/AVIF và nén kích thước.

Áp dụng đúng các bước này sẽ giúp traffic của trang web của bạn tăng trưởng vượt bậc!`,
      coverUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      category: 'SEO & Performance',
      status: 'PUBLISHED',
      isPublished: true,
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 3600000 * 24 * 1), // 1 day ago
    },
    {
      title: 'Chia sẻ kinh nghiệm phỏng vấn vị trí Fullstack Developer',
      slug: 'kinh-nghiem-phong-van-fullstack-dev',
      excerpt: 'Làm thế nào để chinh phục nhà tuyển dụng trong buổi phỏng vấn Fullstack Web? Các chủ đề kỹ thuật trọng tâm bạn cần ôn luyện kĩ càng.',
      content: `Phỏng vấn vị trí Fullstack đòi hỏi bạn phải có kiến thức bao quát cả client lẫn server. Để chuẩn bị tốt nhất:

### Phần Frontend:
- Hiểu sâu về cơ chế quản lý state (Redux/Zustand) và cơ chế re-render của framework bạn dùng.
- CSS layout, Web performance (LCP, FID, CLS).

### Phần Backend & Database:
- Thiết kế hệ thống API RESTful bảo mật (JWT, CORS, Rate limiting).
- Cách thiết kế cơ sở dữ liệu quan hệ (Relational database design) và tối ưu câu lệnh Query, đánh Index đúng cột.

### Kỹ năng mềm:
Hãy thể hiện tinh thần học hỏi, khả năng debug giải quyết vấn đề và kỹ năng làm việc nhóm. Chúc bạn sớm nhận được offer như ý!`,
      coverUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
      category: 'Sự Nghiệp',
      status: 'PUBLISHED',
      isPublished: true,
      authorId: admin.id,
      publishedAt: new Date(),
    },
  ];

  for (const bData of blogData) {
    await prisma.blogPost.create({
      data: bData,
    });
  }
  console.log('  Seeded 4 blog posts with cover images.');

  // 10. Additional Students, Wallet Credit Top-ups, and Course Purchases
  console.log('Seeding financial transactions and course enrollments...');
  
  const additionalStudentsData = [
    { name: 'Hoàng Thùy Linh', email: 'student1@bawuiacademy.vn', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80', topup: 1000, purchases: [courses[0], courses[1]], dobStr: '12121999', dob: new Date('1999-12-12'), phone: '0981112222' },
    { name: 'Trần Tuấn Kiệt', email: 'student2@bawuiacademy.vn', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80', topup: 500, purchases: [courses[3], courses[4]], dobStr: '04081997', dob: new Date('1997-08-04'), phone: '0983334444' },
    { name: 'Lê Minh Hải', email: 'student3@bawuiacademy.vn', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80', topup: 300, purchases: [courses[5]], dobStr: '18091996', dob: new Date('1996-09-18'), phone: '0985556666' },
    { name: 'Phạm Mai Phương', email: 'student4@bawuiacademy.vn', avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&h=150&q=80', topup: 400, purchases: [courses[7]], dobStr: '25112000', dob: new Date('2000-11-25'), phone: '0987778888' },
  ];

  for (const st of additionalStudentsData) {
    const costSum = st.purchases.reduce((acc, curr) => acc + curr.priceCredit, 0);
    const balance = st.topup - costSum;
    const passwordHash = await makePasswordHash(st.email, st.dobStr);

    const u = await prisma.user.create({
      data: {
        email: st.email,
        name: st.name,
        passwordHash: passwordHash,
        role: 'STUDENT',
        avatarUrl: st.avatarUrl,
        phone: st.phone,
        dateOfBirth: st.dob,
        emailVerified: new Date(),
        wallet: { create: { balance } },
      },
      include: { wallet: true },
    });

    const wallet = u.wallet!;

    // Top-up transaction
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount: st.topup,
        type: 'TOPUP',
        description: `Nạp ${st.topup} credits qua cổng thanh toán Stripe`,
        stripePaymentId: `ch_stripe_${Math.random().toString(36).substring(2, 10)}`,
        createdAt: new Date(Date.now() - 3600000 * 24 * 4),
      },
    });

    // Purchase transactions & enrollments
    for (const c of st.purchases) {
      await prisma.enrollment.create({
        data: {
          userId: u.id,
          courseId: c.id,
          progress: Math.floor(Math.random() * 80),
          enrolledAt: new Date(Date.now() - 3600000 * 24 * 2),
        },
      });

      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: -c.priceCredit,
          type: 'PURCHASE',
          description: `Đăng ký khóa học: ${c.title}`,
          relatedCourseId: c.id,
          createdAt: new Date(Date.now() - 3600000 * 24 * 2),
        },
      });
    }
  }

  // Also add some TOPUP transactions for the demo student to show transaction history
  const demoStudentWallet = await prisma.creditWallet.findUnique({
    where: { userId: student.id }
  });
  if (demoStudentWallet) {
    await prisma.transaction.create({
      data: {
        walletId: demoStudentWallet.id,
        amount: 1000,
        type: 'TOPUP',
        description: 'Nạp 1000 credits qua cổng thanh toán Stripe',
        stripePaymentId: 'ch_stripe_demo123',
        createdAt: new Date(Date.now() - 3600000 * 24 * 6),
      }
    });

    await prisma.transaction.create({
      data: {
        walletId: demoStudentWallet.id,
        amount: -rCourse.priceCredit,
        type: 'PURCHASE',
        description: `Đăng ký khóa học: ${rCourse.title}`,
        relatedCourseId: rCourse.id,
        createdAt: new Date(Date.now() - 3600000 * 24 * 5),
      }
    });

    await prisma.creditWallet.update({
      where: { id: demoStudentWallet.id },
      data: { balance: 1000 - rCourse.priceCredit }
    });
  }

  console.log('  Seeded additional students, transactions and enrollments.');

  // 11. Roadmaps Seeding
  console.log('Seeding learning roadmaps...');
  await prisma.roadmap.createMany({
    data: [
      {
        title: "Frontend Developer",
        level: "Beginner → Intermediate",
        summary: "Làm chủ HTML, CSS, JavaScript, Tailwind CSS và chuyên sâu thư viện ReactJS/Next.js để kiến tạo các giao diện người dùng hiện đại và hiệu năng cao.",
        description: "Lộ trình cho người muốn xây dựng giao diện web chuyên nghiệp. Bắt đầu từ nền tảng web cơ bản đến các framework nâng cao, học cách tối ưu hiệu năng và deploy ứng dụng.",
        steps: JSON.stringify(["HTML/CSS", "JavaScript", "TypeScript", "React", "Next.js", "Deploy"]),
        badgeColor: "blue",
        orderIndex: 1,
      },
      {
        title: "Backend Developer",
        level: "Intermediate → Advanced",
        summary: "Tập trung xây dựng hệ thống API, quản trị Cơ sở dữ liệu (PostgreSQL/MongoDB), thiết kế cấu trúc Server bền vững với Node.js, Python, và Golang.",
        description: "Lộ trình cho người muốn làm việc với server, database và API. Thiết lập kiến trúc microservices, tối ưu hóa caching, bảo mật thông tin và vận hành đám mây.",
        steps: JSON.stringify(["Node.js", "Express/NestJS", "PostgreSQL", "Redis", "Docker", "AWS"]),
        badgeColor: "purple",
        orderIndex: 2,
      },
      {
        title: "Fullstack Developer",
        level: "Intermediate → Professional",
        summary: "Kết hợp sức mạnh phát triển giao diện đỉnh cao với tư duy quản lý cơ sở dữ liệu và vận hành cloud, làm chủ toàn bộ vòng đời ứng dụng web.",
        description: "Từ frontend đến backend, database, authentication và deployment. Trở thành lập trình viên toàn năng, có khả năng xây dựng và triển khai các dự án quy mô lớn độc lập.",
        steps: JSON.stringify(["Frontend", "Backend", "Prisma", "NextAuth", "Stripe Payment", "CI/CD", "Vercel"]),
        badgeColor: "indigo",
        orderIndex: 3,
      },
      {
        title: "EdTech Builder",
        level: "Project-based",
        summary: "Xây dựng nền tảng học trực tuyến hoàn chỉnh: khóa học, video player, note mốc thời gian, trắc nghiệm, payment và admin portal.",
        description: "Xây dựng nền tảng học trực tuyến hoàn chỉnh giống như BawuiAcademy. Thực hành làm các tính năng thực tế từ tích hợp luồng video, chấm điểm quiz tự động đến thanh toán ví credit.",
        steps: JSON.stringify(["Next.js", "Prisma ORM", "Auth.js", "Video Player", "Quiz System", "Wallet Credits", "Admin Panel"]),
        badgeColor: "emerald",
        orderIndex: 4,
      },
    ],
  });
  console.log('  Learning roadmaps seeded.');

  console.log('\nSeed completed successfully!');
  console.log('Use credentials to log in:');
  console.log('  Admin:   admin@bawuiacademy.vn / admin123456');
  console.log('  Student: student@bawuiacademy.vn / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
