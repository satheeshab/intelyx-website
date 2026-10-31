// Product catalogue. Edit the copy here; the home page, products page, menus and
// footer all read from this file. 'id' is also the URL anchor and the ?product= value.

export const PRODUCTS = [
  {
    "id": "schools-erp",
    "name": "Schools ERP",
    "icon": "school",
    "short": "Admissions, attendance, exams and fees in one place.",
    "card": "Admissions, attendance, exams, fees and parent communication in one connected system."
  },
  {
    "id": "hospitals-erp",
    "name": "Hospitals ERP",
    "icon": "hospital",
    "short": "Patients, OPD/IPD, billing, pharmacy and lab.",
    "card": "Patient records, OPD and IPD, billing, pharmacy and lab, managed from a single dashboard."
  },
  {
    "id": "accounting",
    "name": "Accounting Software",
    "icon": "calculator",
    "short": "GST-ready books, invoicing and reports.",
    "card": "GST-ready accounting, invoicing and financial reports that keep your books clear and current."
  },
  {
    "id": "service-booking",
    "name": "Service Booking Software",
    "icon": "calendar-check",
    "short": "Online bookings, reminders and payments.",
    "card": "Online bookings, automated reminders and payments that keep your calendar full."
  }
];

export const PRODUCT_DETAILS = {
  "schools-erp": {
    "eyebrow": "For education",
    "overview": "Run your entire school from one place. Intelyx Schools ERP connects admissions, academics, fees, staff and parent communication, so your team spends less time on registers and more time on students.",
    "who": "K-12 schools, colleges and coaching institutes.",
    "features": [
      {
        "icon": "users",
        "title": "Admissions and student records",
        "text": "Online applications, enquiry tracking and a complete digital profile for every student."
      },
      {
        "icon": "clipboard-check",
        "title": "Attendance",
        "text": "Mark daily or period-wise attendance in seconds, with automatic alerts to parents."
      },
      {
        "icon": "calendar",
        "title": "Timetable",
        "text": "Build clash-free timetables and manage substitutions without the spreadsheet juggling."
      },
      {
        "icon": "file-text",
        "title": "Exams and report cards",
        "text": "Flexible grading schemes, quick marks entry and print-ready report cards."
      },
      {
        "icon": "credit-card",
        "title": "Fees and online payments",
        "text": "Fee structures, concessions, receipts and online payments, with reminders for dues."
      },
      {
        "icon": "briefcase",
        "title": "Staff and payroll",
        "text": "Staff records, leave, attendance and accurate monthly payroll with payslips."
      },
      {
        "icon": "bus",
        "title": "Transport and library",
        "text": "Routes, stops and vehicle assignments, plus a full library catalogue with issues and returns."
      },
      {
        "icon": "smartphone",
        "title": "Portals and mobile notifications",
        "text": "Dedicated portals for parents, teachers and students, with instant notifications on their phones."
      }
    ]
  },
  "hospitals-erp": {
    "eyebrow": "For healthcare",
    "overview": "Give doctors, nurses and front-desk teams one reliable system. Intelyx Hospitals ERP brings registration, clinical records, billing, pharmacy and diagnostics together, so patients move through faster and nothing gets lost.",
    "who": "Hospitals, multi-specialty clinics and diagnostic centres.",
    "features": [
      {
        "icon": "user",
        "title": "Patient registration and EMR",
        "text": "Quick registration with a unique patient ID and a complete electronic medical record."
      },
      {
        "icon": "bed",
        "title": "OPD and IPD management",
        "text": "Consultations, admissions, bed allocation, transfers and discharge summaries."
      },
      {
        "icon": "calendar-check",
        "title": "Appointment scheduling",
        "text": "Online and front-desk booking with doctor-wise slots and automatic confirmations."
      },
      {
        "icon": "receipt",
        "title": "Billing and insurance / TPA",
        "text": "Itemised bills, packages, advances and smooth insurance and TPA claim handling."
      },
      {
        "icon": "pill",
        "title": "Pharmacy and inventory",
        "text": "Stock, batch and expiry tracking, with billing linked directly to prescriptions."
      },
      {
        "icon": "flask",
        "title": "Laboratory and radiology",
        "text": "Test orders, sample tracking and digital reports delivered to doctors and patients."
      },
      {
        "icon": "stethoscope",
        "title": "Doctor and staff scheduling",
        "text": "Duty rosters, shifts and on-call schedules for doctors, nurses and support staff."
      },
      {
        "icon": "chart",
        "title": "Analytics dashboards",
        "text": "Live views of revenue, occupancy, footfall and department performance."
      }
    ]
  },
  "accounting": {
    "eyebrow": "For growing businesses",
    "overview": "Keep your books accurate without the stress. Intelyx Accounting gives you GST-ready billing, clear ledgers and real-time reports, so you always know where your business stands.",
    "who": "Shops, SMEs, restaurants, hotels and non-profits.",
    "features": [
      {
        "icon": "book",
        "title": "Ledgers and vouchers",
        "text": "Record sales, purchases, payments, receipts and journals in a familiar format."
      },
      {
        "icon": "receipt",
        "title": "Invoicing and billing",
        "text": "Professional, branded invoices and quotes you can share by email or WhatsApp."
      },
      {
        "icon": "percent",
        "title": "GST-compliant tax reports",
        "text": "GST-ready invoices with HSN/SAC codes and return-ready summaries for easy filing."
      },
      {
        "icon": "package",
        "title": "Inventory",
        "text": "Track stock across items and locations, with low-stock alerts and valuation."
      },
      {
        "icon": "landmark",
        "title": "Bank reconciliation",
        "text": "Match bank statements with your books in minutes and spot differences instantly."
      },
      {
        "icon": "repeat",
        "title": "Receivables and payables",
        "text": "See who owes you and whom you owe, with ageing reports and payment reminders."
      },
      {
        "icon": "pie",
        "title": "Financial statements",
        "text": "Profit and loss, balance sheet and cash flow statements, always up to date."
      },
      {
        "icon": "lock",
        "title": "Multi-user access with roles",
        "text": "Give your accountant, staff and partners exactly the access they need, and no more."
      }
    ]
  },
  "service-booking": {
    "eyebrow": "For service businesses",
    "overview": "Let customers book you any time, from any device. Intelyx Service Booking handles scheduling, reminders and payments automatically, so you can focus on delivering a great service.",
    "who": "Salons, spas, clinics, repair services, consultants and studios.",
    "features": [
      {
        "icon": "globe",
        "title": "Online booking page",
        "text": "A branded booking page customers can use around the clock, on any device."
      },
      {
        "icon": "calendar",
        "title": "Calendar and staff scheduling",
        "text": "See every appointment by staff member or room, and avoid double bookings."
      },
      {
        "icon": "bell",
        "title": "Automated reminders",
        "text": "SMS, WhatsApp and email reminders that cut no-shows and last-minute gaps."
      },
      {
        "icon": "credit-card",
        "title": "Online payments and deposits",
        "text": "Collect full payments or deposits at the time of booking."
      },
      {
        "icon": "user",
        "title": "Customer profiles and history",
        "text": "Preferences, past visits and notes in one place for a more personal service."
      },
      {
        "icon": "tag",
        "title": "Service and pricing catalogue",
        "text": "Organise services, durations, packages and prices the way you sell them."
      },
      {
        "icon": "star",
        "title": "Reviews and feedback",
        "text": "Collect feedback after every visit and build trust with genuine reviews."
      },
      {
        "icon": "chart",
        "title": "Reports",
        "text": "Track bookings, revenue, staff utilisation and repeat customers at a glance."
      }
    ]
  }
};
