// Content for each product's own page (/products/<id>). Edit the copy here.
// The page also uses the product's name, overview, "who it's for" and features from products.js.
//
// screens: three product screens per page. Each is drawn as an illustrative mock-up from the
//   values below. To use a real screenshot instead, add  image: { src: '/assets/img/…', alt: '…' }
//   to that screen (put the file in client/public/assets/img/). Use 1600×1000 px or similar.
//   kpis:  [label, value, change]       chart: 8 bar heights (0–100)
//   rows:  [text, status, tone]         tone: 'ok' (green), 'warn' (amber) or 'info' (neutral)
// faqs: shown on the page and sent to search engines as FAQ structured data.

export const PRODUCT_PAGES = {
  'schools-erp': {
    seoTitle: 'Schools ERP Software for K-12 Schools and Colleges | Intelyx',
    seoDescription:
      'Intelyx Schools ERP: admissions, attendance, timetable, exams, fees, payroll and parent portals in one cloud system. Built in Bengaluru for Indian schools. Book a free demo.',
    headline: 'School management software that gives your staff their time back',
    screens: [
      {
        title: 'Fee collection at a glance',
        caption: 'See collected, pending and overdue fees by class, and send reminders for dues in one click.',
        url: 'app.intelyx.co.in/fees',
        heading: 'Fees',
        tag: 'Term 2',
        kpis: [['Collected', '₹18.6L', '▲ 6.4%'], ['Pending', '₹2.1L', '42 students'], ['Online share', '71%', '▲ 9%']],
        chart: [52, 64, 48, 70, 58, 82, 94, 76],
        rows: [['Grade 8 B, Q2 fees, R. Iyer', 'Paid', 'ok'], ['Grade 5 A, Transport, S. Khan', 'Due 15 Nov', 'warn']],
      },
      {
        title: 'Attendance in seconds',
        caption: 'Teachers mark daily or period-wise attendance on any device. Parents of absent students are alerted automatically.',
        url: 'app.intelyx.co.in/attendance',
        heading: 'Attendance, Grade 6 A',
        tag: 'Today',
        kpis: [['Present', '38', 'of 40'], ['Absent', '2', 'Parents alerted'], ['Month average', '96.1%', '▲ 0.8%']],
        rows: [['Aarav Menon', 'Present', 'ok'], ['Diya Kulkarni', 'Present', 'ok'], ['Kabir Shetty', 'Absent', 'warn'], ['Meera Joshi', 'Present', 'ok']],
      },
      {
        title: 'Report cards without the late nights',
        caption: 'Enter marks once, apply your grading scheme and print report cards for a whole class.',
        url: 'app.intelyx.co.in/exams',
        heading: 'Half-yearly exams',
        tag: 'Grade 9',
        kpis: [['Marks entered', '100%', 'All subjects'], ['Class average', '78.4%', '▲ 2.1%'], ['Report cards', '45', 'Ready to print']],
        rows: [['Mathematics, Grade 9 A', 'Published', 'ok'], ['Science, Grade 9 B', 'In review', 'info']],
      },
    ],
    faqs: [
      { q: 'Is Intelyx Schools ERP suitable for CBSE, ICSE and state board schools?', a: 'Yes. Grading schemes, exam patterns and report card formats are configurable, so you can set them up to match your board and your own school policies.' },
      { q: 'Can parents pay fees online?', a: 'Yes. Parents can pay through the parent portal, receipts are generated automatically, and the system can send reminders for upcoming and overdue dues.' },
      { q: 'Do parents and teachers get their own access?', a: 'Yes. There are separate portals for parents, teachers and students, with notifications on their phones for attendance, fees, homework and announcements. Each person sees only what their role allows.' },
      { q: 'Can we move our existing student records into the system?', a: 'Yes. As part of onboarding we import your student, staff and fee records from spreadsheets or your current software, so you don\'t start from scratch.' },
      { q: 'Does it work for colleges and coaching institutes too?', a: 'Yes. Courses, batches, timetables and fee structures can be configured for colleges and coaching institutes as well as K-12 schools.' },
      { q: 'How long does it take to go live?', a: 'It depends on the size of your school and how much data we bring across. We agree a clear plan during the demo and handle setup, data import and staff training with you.' },
    ],
  },

  'hospitals-erp': {
    seoTitle: 'Hospital Management Software for Hospitals and Clinics | Intelyx',
    seoDescription:
      'Intelyx Hospitals ERP: patient registration, EMR, OPD/IPD, billing, insurance/TPA, pharmacy, lab and analytics in one cloud system for Indian hospitals. Book a free demo.',
    headline: 'Hospital management software that keeps patients moving',
    screens: [
      {
        title: 'Today\'s OPD on one screen',
        caption: 'See every doctor\'s queue, waiting times and consultations as they happen, and move patients along without phone calls.',
        url: 'app.intelyx.co.in/opd',
        heading: 'OPD queue',
        tag: 'Today',
        kpis: [['Patients seen', '184', '▲ 11%'], ['Average wait', '14 min', '▼ 3 min'], ['Appointments', '212', 'Booked']],
        rows: [['Dr. Rao, General Medicine', '6 waiting', 'info'], ['Dr. Fernandes, Paediatrics', '2 waiting', 'ok'], ['Dr. Gupta, Orthopaedics', '9 waiting', 'warn']],
      },
      {
        title: 'Beds and admissions in real time',
        caption: 'Track occupancy by ward, allocate beds, record transfers and prepare discharge summaries.',
        url: 'app.intelyx.co.in/ipd',
        heading: 'Inpatients',
        tag: 'Live',
        kpis: [['Occupancy', '82%', '96 of 117 beds'], ['Admissions', '14', 'Today'], ['Discharges', '11', 'Today']],
        chart: [70, 74, 78, 72, 80, 84, 82, 86],
        rows: [['Bed 204, General Ward', 'Discharge pending', 'warn'], ['Bed 312, ICU', 'Occupied', 'info']],
      },
      {
        title: 'Billing that matches the care given',
        caption: 'Bills pull in consultations, procedures, pharmacy and lab tests automatically, with packages, advances and TPA claims.',
        url: 'app.intelyx.co.in/billing',
        heading: 'Billing',
        tag: 'This month',
        kpis: [['Revenue', '₹48.2L', '▲ 7.5%'], ['TPA claims', '63', '12 pending'], ['Pharmacy', '₹9.8L', '▲ 4.2%']],
        rows: [['IP bill, Patient #4471', 'Settled', 'ok'], ['TPA claim, Patient #4402', 'Awaiting approval', 'warn']],
      },
    ],
    faqs: [
      { q: 'Is Intelyx Hospitals ERP right for a small clinic as well as a hospital?', a: 'Yes. You can start with registration, appointments, OPD and billing, then switch on IPD, pharmacy, lab and other modules as you grow.' },
      { q: 'Does it handle insurance and TPA claims?', a: 'Yes. You can record insurance and TPA details for each patient, create claim-ready bills and track every claim until it is settled.' },
      { q: 'Are pharmacy and lab connected to billing?', a: 'Yes. Pharmacy sales are billed against prescriptions with batch and expiry tracking, and lab and radiology tests flow from the doctor\'s order to the bill and the digital report.' },
      { q: 'How is patient data kept secure?', a: 'Access is role-based, so each person sees only what they need. Connections are encrypted, actions are recorded in audit trails, and data is backed up automatically on secure cloud infrastructure.' },
      { q: 'Can doctors see a patient\'s history?', a: 'Yes. Every patient has a unique ID and an electronic medical record with past visits, diagnoses, prescriptions and reports in one place.' },
      { q: 'Can you bring across our existing patient records?', a: 'Yes. We import patient and master data from your current system or spreadsheets during onboarding, and train your doctors, nurses and front-desk staff.' },
    ],
  },

  accounting: {
    seoTitle: 'GST Accounting and Billing Software for SMEs | Intelyx',
    seoDescription:
      'Intelyx Accounting: GST-ready invoicing, ledgers, inventory, bank reconciliation, receivables and financial statements for Indian shops and SMEs. Book a free demo.',
    headline: 'GST-ready accounting that shows where your business stands',
    screens: [
      {
        title: 'Your business on one dashboard',
        caption: 'Sales, expenses, receivables and cash at a glance, updated as you record transactions.',
        url: 'app.intelyx.co.in/accounts',
        heading: 'Overview',
        tag: 'This month',
        kpis: [['Sales', '₹14.8L', '▲ 9.1%'], ['Receivables', '₹3.2L', '18 invoices'], ['Cash and bank', '₹6.4L', '▲ 2.3%']],
        chart: [44, 58, 50, 66, 62, 74, 70, 88],
        rows: [['Invoice #2216, Sharma Traders', 'Paid', 'ok'], ['Invoice #2209, Patel Stores', 'Overdue 6 days', 'warn']],
      },
      {
        title: 'Professional GST invoices in seconds',
        caption: 'Create branded invoices with HSN/SAC codes and the right tax split, then share them by email or WhatsApp.',
        url: 'app.intelyx.co.in/invoices',
        heading: 'New invoice',
        tag: 'GST',
        kpis: [['Taxable value', '₹42,000', '3 items'], ['CGST + SGST', '₹7,560', '18%'], ['Invoice total', '₹49,560', 'Due in 15 days']],
        rows: [['LED panel, HSN 9405', '₹24,000', 'info'], ['Installation, SAC 9954', '₹18,000', 'info']],
      },
      {
        title: 'Bank reconciliation in minutes',
        caption: 'Match bank statement lines with your books automatically and spot differences straight away.',
        url: 'app.intelyx.co.in/bank',
        heading: 'Reconciliation',
        tag: 'October',
        kpis: [['Matched', '214', 'Automatically'], ['To review', '6', 'Lines'], ['Difference', '₹0', 'Balanced']],
        rows: [['UPI receipt, ₹12,400', 'Matched', 'ok'], ['NEFT payment, ₹8,950', 'Review', 'warn']],
      },
    ],
    faqs: [
      { q: 'Is Intelyx Accounting GST compliant?', a: 'Yes. Invoices carry GSTIN, HSN/SAC codes and the correct CGST, SGST or IGST split, and the software prepares return-ready summaries to make filing easier.' },
      { q: 'Can my accountant use it too?', a: 'Yes. You can give your accountant, staff and partners their own logins with only the access they need.' },
      { q: 'Does it manage stock?', a: 'Yes. You can track items across locations, get low-stock alerts and see stock valuation, with stock updated automatically from your sales and purchases.' },
      { q: 'Can I send invoices and payment reminders on WhatsApp?', a: 'Yes. Invoices and quotes can be shared by email or WhatsApp, and the system helps you follow up on overdue payments.' },
      { q: 'Can we move from our current accounting software or spreadsheets?', a: 'Yes. We help bring across your opening balances, ledgers, customers, suppliers and items during onboarding.' },
      { q: 'Is it suitable for restaurants, hotels and non-profits?', a: 'Yes. Ledgers, vouchers, reports and user roles can be set up for shops, SMEs, restaurants, hotels and non-profit organisations.' },
    ],
  },

  'service-booking': {
    seoTitle: 'Online Booking Software for Salons, Clinics and Services | Intelyx',
    seoDescription:
      'Intelyx Service Booking: a branded online booking page, staff calendar, SMS/WhatsApp reminders, deposits and payments for salons, spas, clinics and service businesses. Book a free demo.',
    headline: 'Online booking software that keeps your calendar full',
    screens: [
      {
        title: 'Every appointment, every staff member',
        caption: 'See the day by staff member or room, move appointments around and avoid double bookings.',
        url: 'app.intelyx.co.in/calendar',
        heading: 'Calendar',
        tag: 'Today',
        kpis: [['Bookings', '46', '▲ 8%'], ['Utilisation', '84%', 'Across 6 staff'], ['No-shows', '1', '▼ 3 this week']],
        rows: [['10:00, Haircut, Anjali with Ravi', 'Confirmed', 'ok'], ['11:30, Facial, Neha with Priya', 'Deposit paid', 'ok'], ['12:15, Consultation, Arjun', 'Awaiting reply', 'warn']],
      },
      {
        title: 'A booking page customers love',
        caption: 'Customers pick a service, staff member and time on any device, and can pay a deposit when they book.',
        url: 'book.intelyx.co.in/your-business',
        heading: 'Book an appointment',
        tag: 'Online',
        kpis: [['Online bookings', '62%', 'Of all bookings'], ['Deposits', '₹38,500', 'This month'], ['Rating', '4.8 ★', '126 reviews']],
        rows: [['Haircut and styling, 45 min', '₹800', 'info'], ['Deep-tissue massage, 60 min', '₹2,200', 'info']],
      },
      {
        title: 'Reports that show what\'s working',
        caption: 'Track bookings, revenue, staff utilisation and repeat customers over time.',
        url: 'app.intelyx.co.in/reports',
        heading: 'Reports',
        tag: 'Last 8 weeks',
        kpis: [['Revenue', '₹6.2L', '▲ 12%'], ['Repeat customers', '58%', '▲ 4%'], ['Average ticket', '₹1,340', '▲ 6%']],
        chart: [48, 55, 52, 63, 60, 71, 78, 84],
      },
    ],
    faqs: [
      { q: 'Can customers book without calling us?', a: 'Yes. You get a branded online booking page that customers can use any time, on any device, to choose a service, staff member and time slot.' },
      { q: 'How do reminders work?', a: 'Customers receive automatic SMS, WhatsApp and email reminders before their appointment, which helps cut no-shows and last-minute gaps.' },
      { q: 'Can we take deposits or full payment online?', a: 'Yes. You can collect a deposit or the full amount at the time of booking, and see every payment against the appointment.' },
      { q: 'Does it work for businesses with several staff or rooms?', a: 'Yes. You can manage schedules for each staff member and room, set working hours and breaks, and the calendar prevents double bookings.' },
      { q: 'Which businesses is it for?', a: 'Salons, spas, clinics, studios, consultants, repair services and any business that runs on appointments.' },
      { q: 'Can customers leave reviews?', a: 'Yes. The system asks for feedback after each visit, so you can track satisfaction and build trust with genuine reviews.' },
    ],
  },
};

// Steps shown on every product page.
export const ONBOARDING_STEPS = [
  { icon: 'message', title: 'Free demo', text: 'A 30 to 45 minute video call, tailored to how your organisation works.' },
  { icon: 'database', title: 'Setup and data import', text: 'We configure the system and bring across your existing records.' },
  { icon: 'users', title: 'Training', text: 'Your team learns the system on-site or online, at their own pace.' },
  { icon: 'headset', title: 'Go-live and support', text: 'We stay with you after launch, with a Bengaluru-based support team.' },
];
