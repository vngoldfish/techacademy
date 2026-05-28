import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Admin user
  const adminPassword = await hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@techacademy.vn' },
    update: {},
    create: {
      email: 'admin@techacademy.vn',
      name: 'Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      wallet: { create: { balance: 0 } },
    },
  });
  console.log('  Admin user created');

  // 2. Demo student
  const studentPassword = await hash('student123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@techacademy.vn' },
    update: {},
    create: {
      email: 'student@techacademy.vn',
      name: 'Nguyen Van Student',
      passwordHash: studentPassword,
      role: 'STUDENT',
      emailVerified: new Date(),
      wallet: { create: { balance: 500 } },
    },
  });
  console.log('  Student user created (500 credit)');

  // 3. App settings
  await prisma.setting.createMany({
    data: [
      { key: 'CREDIT_PRICE_VND', value: '1000' },
      { key: 'MIN_TOPUP_CREDIT', value: '100' },
      { key: 'MAX_TOPUP_CREDIT', value: '10000' },
    ],
    skipDuplicates: true,
  });

  // 4. Course 1: React Basics
  const course1 = await prisma.course.upsert({
    where: { slug: 'react-co-ban' },
    update: {},
    create: {
      title: 'ReactJS Cơ Bản',
      slug: 'react-co-ban',
      description: 'Khóa học ReactJS từ零 cho người mới bắt đầu. Học các khái niệm cơ bản: Components, Props, State, Hooks, và cách xây dựng ứng dụng React thực tế.',
      priceCredit: 100,
      isPublished: true,
      creatorId: admin.id,
    },
  });

  // Session 1.1
  const s1_1 = await prisma.session.create({
    data: {
      courseId: course1.id,
      title: 'Buổi 1: Giới thiệu React',
      description: 'Tổng quan về React, tại sao nên học React, cài đặt môi trường',
      orderIndex: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sessionId: s1_1.id,
        title: 'React là gì? Tại sao nên học React?',
        videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
        videoType: 'YOUTUBE',
        duration: 480,
        orderIndex: 1,
        isFree: true,
      },
      {
        sessionId: s1_1.id,
        title: 'Cài đặt Node.js và VS Code',
        videoUrl: 'https://www.youtube.com/watch?v=IHrqpR4hME8',
        videoType: 'YOUTUBE',
        duration: 600,
        orderIndex: 2,
        isFree: true,
      },
      {
        sessionId: s1_1.id,
        title: 'Tạo dự án React đầu tiên với Vite',
        videoUrl: 'https://www.youtube.com/watch?v=8JgElbTHn44',
        videoType: 'YOUTUBE',
        duration: 720,
        orderIndex: 3,
        isFree: false,
      },
    ],
  });

  // Session 1.2
  const s1_2 = await prisma.session.create({
    data: {
      courseId: course1.id,
      title: 'Buổi 2: JSX & Components',
      description: 'Hiểu về JSX, tạo và tái sử dụng Components',
      orderIndex: 2,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sessionId: s1_2.id,
        title: 'JSX là gì? Syntax cơ bản',
        videoUrl: 'https://www.youtube.com/watch?v=9D1x7-2FmTA',
        videoType: 'YOUTUBE',
        duration: 540,
        orderIndex: 1,
      },
      {
        sessionId: s1_2.id,
        title: 'Tạo Component đầu tiên',
        videoUrl: 'https://www.youtube.com/watch?v=9D1x7-2FmTA',
        videoType: 'YOUTUBE',
        duration: 660,
        orderIndex: 2,
      },
      {
        sessionId: s1_2.id,
        title: 'Props truyền dữ liệu giữa Components',
        videoUrl: 'https://www.youtube.com/watch?v=9D1x7-2FmTA',
        videoType: 'YOUTUBE',
        duration: 780,
        orderIndex: 3,
        isGated: true,
      },
    ],
  });

  // Session 1.3
  const s1_3 = await prisma.session.create({
    data: {
      courseId: course1.id,
      title: 'Buổi 3: State & Hooks',
      description: 'Quản lý trạng thái với useState, useEffect',
      orderIndex: 3,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sessionId: s1_3.id,
        title: 'useState Hook - Quản lý trạng thái',
        videoUrl: 'https://www.youtube.com/watch?v=O6P86tEii6c',
        videoType: 'YOUTUBE',
        duration: 900,
        orderIndex: 1,
      },
      {
        sessionId: s1_3.id,
        title: 'useEffect Hook - Side effects',
        videoUrl: 'https://www.youtube.com/watch?v=0ZJgIjIuY7U',
        videoType: 'YOUTUBE',
        duration: 840,
        orderIndex: 2,
        isGated: true,
      },
    ],
  });

  // Quiz for Course 1
  const quiz1 = await prisma.quiz.create({
    data: {
      courseId: course1.id,
      title: 'Kiểm tra giữa khóa - React Cơ Bản',
      description: 'Bài kiểm tra kiến thức cơ bản về React',
      quizType: 'MIDTERM',
      passScore: 60,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        quizId: quiz1.id,
        text: 'React là gì?',
        options: JSON.stringify([
          { label: 'A', text: 'Một ngôn ngữ lập trình' },
          { label: 'B', text: 'Thư viện JavaScript để xây dựng UI' },
          { label: 'C', text: 'Một framework backend' },
          { label: 'D', text: 'Một cơ sở dữ liệu' },
        ]),
        correctAnswer: 'B',
        orderIndex: 1,
      },
      {
        quizId: quiz1.id,
        text: 'Hook nào dùng để quản lý trạng thái trong React?',
        options: JSON.stringify([
          { label: 'A', text: 'useEffect' },
          { label: 'B', text: 'useRef' },
          { label: 'C', text: 'useState' },
          { label: 'D', text: 'useMemo' },
        ]),
        correctAnswer: 'C',
        orderIndex: 2,
      },
      {
        quizId: quiz1.id,
        text: 'JSX là gì?',
        options: JSON.stringify([
          { label: 'A', text: 'Một ngôn ngữ mới' },
          { label: 'B', text: 'Syntax extension cho JavaScript, cho phép viết HTML trong JS' },
          { label: 'C', text: 'Một framework CSS' },
          { label: 'D', text: 'Một package manager' },
        ]),
        correctAnswer: 'B',
        orderIndex: 3,
      },
      {
        quizId: quiz1.id,
        text: 'Props trong React có thể thay đổi từ component con không?',
        options: JSON.stringify([
          { label: 'A', text: 'Có, thoải mái' },
          { label: 'B', text: 'Chỉ khi dùng useState' },
          { label: 'C', text: 'Không, props là read-only' },
          { label: 'D', text: 'Tùy thuộc vào version React' },
        ]),
        correctAnswer: 'C',
        orderIndex: 4,
      },
      {
        quizId: quiz1.id,
        text: 'useEffect chạy khi nào?',
        options: JSON.stringify([
          { label: 'A', text: 'Chỉ lần đầu render' },
          { label: 'B', text: 'Mỗi khi state thay đổi' },
          { label: 'C', text: 'Sau mỗi lần render (hoặc khi dependency thay đổi)' },
          { label: 'D', text: 'Trước khi render' },
        ]),
        correctAnswer: 'C',
        orderIndex: 5,
      },
    ],
  });

  console.log('  Course 1: ReactJS Co Ban (3 sessions, 8 lessons, 1 quiz)');

  // 5. Course 2: Next.js
  const course2 = await prisma.course.upsert({
    where: { slug: 'nextjs-tu-co-ban-den-nang-cao' },
    update: {},
    create: {
      title: 'Next.js Từ Cơ Bản Đến Nâng Cao',
      slug: 'nextjs-tu-co-ban-den-nang-cao',
      description: 'Khóa học Next.js toàn diện: App Router, Server Components, API Routes, Authentication, Database, Deployment. Xây dựng dự án thực tế từ đầu.',
      priceCredit: 200,
      isPublished: true,
      creatorId: admin.id,
    },
  });

  const s2_1 = await prisma.session.create({
    data: {
      courseId: course2.id,
      title: 'Buổi 1: Next.js Fundamentals',
      description: 'Giới thiệu Next.js, SSR vs SSG, App Router',
      orderIndex: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sessionId: s2_1.id,
        title: 'Next.js là gì? SSR, SSG, ISR',
        videoUrl: 'https://www.youtube.com/watch?v=mTz0GXZ_7Yc',
        videoType: 'YOUTUBE',
        duration: 720,
        orderIndex: 1,
        isFree: true,
      },
      {
        sessionId: s2_1.id,
        title: 'App Router - Hệ thống routing mới',
        videoUrl: 'https://www.youtube.com/watch?v=ZVnjOPwG4bp',
        videoType: 'YOUTUBE',
        duration: 900,
        orderIndex: 2,
      },
      {
        sessionId: s2_1.id,
        title: 'Server Components vs Client Components',
        videoUrl: 'https://www.youtube.com/watch?v=R4GMeG1llyQ',
        videoType: 'YOUTUBE',
        duration: 660,
        orderIndex: 3,
      },
    ],
  });

  const s2_2 = await prisma.session.create({
    data: {
      courseId: course2.id,
      title: 'Buổi 2: API & Database',
      description: 'Route Handlers, Prisma ORM, PostgreSQL',
      orderIndex: 2,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sessionId: s2_2.id,
        title: 'API Route Handlers trong Next.js',
        videoUrl: 'https://www.youtube.com/watch?v=ZMIQz2pvqBo',
        videoType: 'YOUTUBE',
        duration: 780,
        orderIndex: 1,
      },
      {
        sessionId: s2_2.id,
        title: 'Prisma ORM - Kết nối Database',
        videoUrl: 'https://www.youtube.com/watch?v=YaT1E8bqjAM',
        videoType: 'YOUTUBE',
        duration: 960,
        orderIndex: 2,
        isGated: true,
      },
    ],
  });

  // Quiz for Course 2
  const quiz2 = await prisma.quiz.create({
    data: {
      courseId: course2.id,
      title: 'Kiểm tra - Next.js Basics',
      quizType: 'MIDTERM',
      passScore: 60,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        quizId: quiz2.id,
        text: 'Next.js hỗ trợ những kiểu rendering nào?',
        options: JSON.stringify([
          { label: 'A', text: 'Chỉ CSR' },
          { label: 'B', text: 'SSR, SSG, ISR' },
          { label: 'C', text: 'Chỉ SSR' },
          { label: 'D', text: 'SSR và CSR' },
        ]),
        correctAnswer: 'B',
        orderIndex: 1,
      },
      {
        quizId: quiz2.id,
        text: 'Server Components trong Next.js có đặc điểm gì?',
        options: JSON.stringify([
          { label: 'A', text: 'Chạy trên browser' },
          { label: 'B', text: 'Chạy trên server, không gửi JS xuống client' },
          { label: 'C', text: 'Giống hoàn toàn Client Components' },
          { label: 'D', text: 'Không thể query database' },
        ]),
        correctAnswer: 'B',
        orderIndex: 2,
      },
      {
        quizId: quiz2.id,
        text: 'Prisma là gì?',
        options: JSON.stringify([
          { label: 'A', text: 'Một framework CSS' },
          { label: 'B', text: 'ORM cho Node.js và TypeScript' },
          { label: 'C', text: 'Một database' },
          { label: 'D', text: 'Một thư viện UI' },
        ]),
        correctAnswer: 'B',
        orderIndex: 3,
      },
    ],
  });

  console.log('  Course 2: Next.js (2 sessions, 5 lessons, 1 quiz)');

  // 6. Course 3: TypeScript
  const course3 = await prisma.course.upsert({
    where: { slug: 'typescript-cho-developer' },
    update: {},
    create: {
      title: 'TypeScript Cho Developer',
      slug: 'typescript-cho-developer',
      description: 'Học TypeScript từ零: types, interfaces, generics, utility types. Áp dụng TypeScript vào dự án React và Node.js thực tế.',
      priceCredit: 80,
      isPublished: true,
      creatorId: admin.id,
    },
  });

  const s3_1 = await prisma.session.create({
    data: {
      courseId: course3.id,
      title: 'Buổi 1: TypeScript Fundamentals',
      orderIndex: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sessionId: s3_1.id,
        title: 'TypeScript là gì? Tại sao nên dùng?',
        videoUrl: 'https://www.youtube.com/watch?v=gp5H0Vw39yw',
        videoType: 'YOUTUBE',
        duration: 540,
        orderIndex: 1,
        isFree: true,
      },
      {
        sessionId: s3_1.id,
        title: 'Basic Types: string, number, boolean, array',
        videoUrl: 'https://www.youtube.com/watch?v=gp5H0Vw39yw',
        videoType: 'YOUTUBE',
        duration: 660,
        orderIndex: 2,
        isFree: true,
      },
      {
        sessionId: s3_1.id,
        title: 'Interface vs Type - Khi nào dùng gì?',
        videoUrl: 'https://www.youtube.com/watch?v=gp5H0Vw39yw',
        videoType: 'YOUTUBE',
        duration: 780,
        orderIndex: 3,
      },
    ],
  });

  console.log('  Course 3: TypeScript (1 session, 3 lessons)');

  // 7. Enroll student in Course 1
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course1.id } },
    update: {},
    create: {
      userId: student.id,
      courseId: course1.id,
      progress: 25,
    },
  });

  // Add some progress for student
  const lessons1 = await prisma.lesson.findMany({
    where: { session: { courseId: course1.id } },
    orderBy: [{ session: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
  });

  if (lessons1.length >= 2) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: student.id, lessonId: lessons1[0].id } },
      update: {},
      create: { userId: student.id, lessonId: lessons1[0].id, videoCompleted: true, completed: true, lastPosition: lessons1[0].duration ?? 0 },
    });
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: student.id, lessonId: lessons1[1].id } },
      update: {},
      create: { userId: student.id, lessonId: lessons1[1].id, videoCompleted: true, completed: true, lastPosition: lessons1[1].duration ?? 0 },
    });
  }

  // Add some video notes
  if (lessons1.length >= 1) {
    await prisma.videoNote.createMany({
      data: [
        { userId: student.id, lessonId: lessons1[0].id, timestamp: 60, content: 'React là thư viện UI do Facebook tạo ra' },
        { userId: student.id, lessonId: lessons1[0].id, timestamp: 180, content: 'Virtual DOM giúp React nhanh hơn' },
        { userId: student.id, lessonId: lessons1[0].id, timestamp: 360, content: 'Component-based architecture - chia nhỏ UI' },
      ],
    });
  }

  console.log('  Student enrolled in Course 1 with progress + notes');

  // 8. Assignment for a lesson
  if (lessons1.length >= 3) {
    await prisma.assignment.create({
      data: {
        lessonId: lessons1[2].id,
        title: 'Bài tập: Tạo ứng dụng React đầu tiên',
        description: 'Tạo một ứng dụng React đơn giản với Vite:\n\n1. Cài đặt dự án với `npm create vite@latest`\n2. Tạo component `HelloWorld` hiển thị "Hello TechAcademy"\n3. Sử dụng `useState` để tạo counter\n4. Submit link GitHub repo',
        isRequired: true,
      },
    });
  }

  console.log('  Assignment created');

  console.log('\nSeed completed!');
  console.log('Accounts:');
  console.log('  Admin:   admin@techacademy.vn / admin123456');
  console.log('  Student: student@techacademy.vn / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
