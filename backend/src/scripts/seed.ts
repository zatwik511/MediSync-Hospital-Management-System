import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../database/db';

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function range(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysBack(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\nMediSync Seed Script');
  console.log('----------------------------------------\n');

  const existing = await pool.query(`SELECT COUNT(*) FROM patients`);
  const count = parseInt(existing.rows[0].count, 10);
  if (count > 0) {
    console.log(`Found ${count} existing patient(s). Wiping all data before re-seeding...\n`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Wipe (preserve _migrations table) ──────────────────────────────────
    console.log('Clearing existing data...');
    await client.query(`DELETE FROM prescriptions`);
    await client.query(`DELETE FROM vitals`);
    await client.query(`DELETE FROM medical_images`);
    await client.query(`DELETE FROM tasks`);
    await client.query(`DELETE FROM appointments`);
    await client.query(`DELETE FROM notifications`);
    await client.query(`DELETE FROM audit_logs`);
    await client.query(`DELETE FROM doctor_availability`);
    await client.query(`DELETE FROM doctors`);
    await client.query(`DELETE FROM patients`);
    await client.query(`DELETE FROM staff`);
    console.log('  Done.\n');

    // ── 2. Staff ──────────────────────────────────────────────────────────────
    console.log('Seeding staff...');
    const pinHash = await bcrypt.hash('000000', 10);

    const staffDefs = [
      { name: 'Admin User',          address: '1 Hospital Road, London, EC1A 1BB',        role: 'admin',        specialization: 'Administration',       code: 'ADM-001' },
      { name: 'Dr. Sarah Chen',      address: '45 Harley Street, London, W1G 8QR',        role: 'doctor',       specialization: 'Cardiology',            code: 'DOC-001' },
      { name: 'Dr. James Okafor',    address: '12 Medical Close, Manchester, M1 2AB',     role: 'doctor',       specialization: 'General Practice',      code: 'DOC-002' },
      { name: 'Dr. Priya Sharma',    address: '22 Radiology Row, Leeds, LS1 1AA',         role: 'doctor',       specialization: 'Radiology',             code: 'DOC-003' },
      { name: 'Dr. Michael Torres',  address: '3 Neurology Way, Edinburgh, EH1 1AA',      role: 'doctor',       specialization: 'Neurology',             code: 'DOC-004' },
      { name: 'Emma Clarke',         address: '7 Reception Lane, Birmingham, B1 1BB',     role: 'receptionist', specialization: 'Patient Administration', code: 'REC-001' },
    ];

    const staffRows: { id: string; name: string; code: string }[] = [];
    for (const s of staffDefs) {
      const r = await client.query(
        `INSERT INTO staff (name, address, role, specialization, staff_code, pin, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING id, name, staff_code`,
        [s.name, s.address, s.role, s.specialization, s.code, pinHash]
      );
      staffRows.push({ id: r.rows[0].id, name: r.rows[0].name, code: r.rows[0].staff_code });
    }
    const byCode = (code: string) => staffRows.find(s => s.code === code)!;
    console.log(`  ${staffRows.length} staff members (PIN for all: 000000)\n`);

    // ── 3. Doctors ────────────────────────────────────────────────────────────
    console.log('Seeding doctors...');

    const DAY: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6,
    };

    const doctorDefs = [
      {
        name: 'Dr. Sarah Chen',       specialty: 'Cardiology',
        days: ['Monday', 'Wednesday', 'Friday'],
        staffCode: 'DOC-001',
      },
      {
        name: 'Dr. James Okafor',     specialty: 'General Practice',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        staffCode: 'DOC-002',
      },
      {
        name: 'Dr. Priya Sharma',     specialty: 'Radiology',
        days: ['Tuesday', 'Thursday'],
        staffCode: 'DOC-003',
      },
      {
        name: 'Dr. Michael Torres',   specialty: 'Neurology',
        days: ['Monday', 'Wednesday', 'Thursday'],
        staffCode: 'DOC-004',
      },
      {
        name: 'Dr. Stephen Strange',  specialty: 'Cardiology',
        days: ['Tuesday', 'Friday'],
        staffCode: null,
      },
      {
        name: 'Dr. Amelia Watson',    specialty: 'Orthopaedics',
        days: ['Monday', 'Tuesday', 'Wednesday'],
        staffCode: null,
      },
      {
        name: 'Dr. Robert Hughes',    specialty: 'Oncology',
        days: ['Wednesday', 'Thursday', 'Friday'],
        staffCode: null,
      },
      {
        name: 'Dr. Fatima Al-Rashid', specialty: 'Endocrinology',
        days: ['Monday', 'Thursday'],
        staffCode: null,
      },
      {
        name: 'Dr. Thomas Blackwell', specialty: 'Psychiatry',
        days: ['Tuesday', 'Wednesday', 'Friday'],
        staffCode: null,
      },
      {
        name: 'Dr. Elizabeth Nguyen', specialty: 'Dermatology',
        days: ['Monday', 'Wednesday'],
        staffCode: null,
      },
    ];

    const doctorRows: { id: string; name: string }[] = [];
    for (const d of doctorDefs) {
      const sId = d.staffCode ? byCode(d.staffCode).id : null;
      const r = await client.query(
        `INSERT INTO doctors (name, specialty, available_days, staff_id) VALUES ($1,$2,$3,$4) RETURNING id, name`,
        [d.name, d.specialty, d.days, sId]
      );
      const docId = r.rows[0].id as string;
      doctorRows.push({ id: docId, name: r.rows[0].name });

      for (const day of d.days) {
        await client.query(
          `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES ($1,$2,$3,$4)`,
          [docId, DAY[day], '09:00', '17:00']
        );
      }
    }
    console.log(`  ${doctorRows.length} doctors with availability\n`);

    // ── 4. Patients ───────────────────────────────────────────────────────────
    console.log('Seeding patients...');

    const patientDefs = [
      {
        name: 'Margaret Thompson', dob: '1956-03-14', gender: 'Female',
        phone: '07700 900123', bloodType: 'A+',
        address: '42 Birchwood Avenue, Manchester, M14 5TH',
        email: 'margaret.thompson@email.co.uk',
        conditions: ['Type 2 Diabetes', 'Hypertension', 'Hypercholesterolaemia'],
        diagnosis: 'Well-controlled Type 2 Diabetes Mellitus with concurrent essential hypertension. On metformin and amlodipine.',
        ecName: 'Brian Thompson', ecRel: 'Husband', ecPhone: '07700 900124',
        allergies: [{ substance: 'Penicillin', reaction: 'Anaphylaxis', severity: 'Life-threatening' }],
      },
      {
        name: 'James Patel', dob: '1979-07-22', gender: 'Male',
        phone: '07911 234567', bloodType: 'B+',
        address: '15 Rosemead Drive, Leicester, LE2 3PQ',
        email: 'james.patel@gmail.com',
        conditions: ['Asthma', 'Allergic Rhinitis'],
        diagnosis: 'Moderate persistent asthma with seasonal allergic rhinitis. Well-controlled on salbutamol and beclomethasone inhaler.',
        ecName: 'Priya Patel', ecRel: 'Wife', ecPhone: '07911 234568',
        allergies: [{ substance: 'Aspirin', reaction: 'Bronchospasm', severity: 'Severe' }],
      },
      {
        name: 'Olivia Bennett', dob: '1990-11-05', gender: 'Female',
        phone: '07833 456789', bloodType: 'O-',
        address: '8 Willowmere Court, Bristol, BS3 1JR',
        email: 'olivia.bennett@hotmail.com',
        conditions: ['Generalised Anxiety Disorder', 'Mild Depression'],
        diagnosis: 'Generalised Anxiety Disorder with mild depressive episode. Currently on sertraline 50mg with regular CBT sessions.',
        ecName: 'Claire Bennett', ecRel: 'Mother', ecPhone: '07833 456790',
        allergies: [],
      },
      {
        name: 'William Hassan', dob: '1952-04-30', gender: 'Male',
        phone: '07799 321654', bloodType: 'AB+',
        address: '67 Croft Lane, Sheffield, S6 2AW',
        email: 'william.hassan@btinternet.com',
        conditions: ['COPD', 'Heart Failure', 'Hypertension'],
        diagnosis: 'Stage 3 COPD with concurrent heart failure (EF 45%). Managed on tiotropium, furosemide, and ramipril.',
        ecName: 'Fatima Hassan', ecRel: 'Wife', ecPhone: '07799 321655',
        allergies: [{ substance: 'ACE Inhibitors', reaction: 'Dry cough', severity: 'Mild' }],
      },
      {
        name: 'Sophie Clarke', dob: '1996-09-18', gender: 'Female',
        phone: '07855 789012', bloodType: 'A-',
        address: '3 Maple Street, Brighton, BN1 4ER',
        email: 'sophie.clarke@gmail.com',
        conditions: ['Irritable Bowel Syndrome', 'Lactose Intolerance'],
        diagnosis: 'IBS-Mixed type with confirmed lactose intolerance. Managing with dietary modifications and mebeverine PRN.',
        ecName: 'Paul Clarke', ecRel: 'Father', ecPhone: '07855 789013',
        allergies: [],
      },
      {
        name: 'David Okafor', dob: '1969-02-14', gender: 'Male',
        phone: '07922 345678', bloodType: 'O+',
        address: '29 Elmhurst Road, Birmingham, B13 8SN',
        email: 'david.okafor@yahoo.co.uk',
        conditions: ['Hypertension', 'Hypercholesterolaemia', 'Obesity'],
        diagnosis: 'Essential hypertension with hypercholesterolaemia. BMI 34.2. On atorvastatin 40mg and amlodipine 5mg.',
        ecName: 'Ngozi Okafor', ecRel: 'Wife', ecPhone: '07922 345679',
        allergies: [{ substance: 'Latex', reaction: 'Contact dermatitis', severity: 'Moderate' }],
      },
      {
        name: 'Charlotte Hughes', dob: '1983-06-27', gender: 'Female',
        phone: '07741 567890', bloodType: 'B-',
        address: '11 Sycamore Close, Leeds, LS7 4AB',
        email: 'charlotte.hughes@outlook.com',
        conditions: ['Rheumatoid Arthritis', 'Osteoporosis'],
        diagnosis: 'Seropositive Rheumatoid Arthritis affecting bilateral hands and wrists. On methotrexate 15mg weekly and folic acid supplementation.',
        ecName: 'Mark Hughes', ecRel: 'Husband', ecPhone: '07741 567891',
        allergies: [{ substance: 'NSAIDs', reaction: 'Gastric ulceration', severity: 'Severe' }],
      },
      {
        name: 'Robert Ahmed', dob: '1961-10-08', gender: 'Male',
        phone: '07766 123456', bloodType: 'A+',
        address: '52 Victoria Gardens, Bradford, BD5 9LM',
        email: 'robert.ahmed@gmail.com',
        conditions: ['Type 2 Diabetes', 'Diabetic Nephropathy', 'Peripheral Neuropathy'],
        diagnosis: 'Advanced Type 2 Diabetes with established nephropathy (eGFR 38). Under renal and diabetic specialist review.',
        ecName: 'Aisha Ahmed', ecRel: 'Wife', ecPhone: '07766 123457',
        allergies: [{ substance: 'Sulphonylureas', reaction: 'Severe hypoglycaemia', severity: 'Life-threatening' }],
      },
      {
        name: 'Emma Sinclair', dob: '2005-01-30', gender: 'Female',
        phone: '07888 901234', bloodType: 'O+',
        address: '6 Park View Terrace, Edinburgh, EH6 7QR',
        email: 'emma.sinclair@gmail.com',
        conditions: ['Childhood Asthma', 'Eczema'],
        diagnosis: 'Well-controlled intermittent asthma with mild atopic eczema. Uses salbutamol PRN and emollient cream daily.',
        ecName: 'Helen Sinclair', ecRel: 'Mother', ecPhone: '07888 901235',
        allergies: [{ substance: 'House dust mites', reaction: 'Asthma exacerbation', severity: 'Moderate' }],
      },
      {
        name: 'Thomas Whitfield', dob: '1946-12-19', gender: 'Male',
        phone: '07600 456789', bloodType: 'AB-',
        address: '89 Chestnut Avenue, Nottingham, NG3 5PP',
        email: 'thomas.whitfield@btinternet.com',
        conditions: ['Atrial Fibrillation', 'Heart Failure', 'Chronic Kidney Disease'],
        diagnosis: 'Permanent atrial fibrillation with heart failure (HFrEF, EF 35%). CKD Stage 3. On apixaban, bisoprolol, and dapagliflozin.',
        ecName: 'Dorothy Whitfield', ecRel: 'Wife', ecPhone: '07600 456790',
        allergies: [{ substance: 'Warfarin', reaction: 'Excessive bleeding', severity: 'Severe' }],
      },
      {
        name: 'Aisha Mohammed', dob: '1987-08-11', gender: 'Female',
        phone: '07877 234567', bloodType: 'A+',
        address: '34 Crescent Road, London, E3 2NQ',
        email: 'aisha.mohammed@hotmail.co.uk',
        conditions: ['Polycystic Ovary Syndrome', 'Insulin Resistance', 'Anxiety'],
        diagnosis: 'PCOS with associated insulin resistance and mild anxiety. Managed with metformin 1g BD, referral to endocrinology.',
        ecName: 'Yusuf Mohammed', ecRel: 'Husband', ecPhone: '07877 234568',
        allergies: [],
      },
      {
        name: 'Liam Fitzgerald', dob: '1972-05-03', gender: 'Male',
        phone: '07533 678901', bloodType: 'B+',
        address: '21 Harbour View, Liverpool, L1 4HR',
        email: 'liam.fitzgerald@gmail.com',
        conditions: ['Lumbar Disc Disease', 'Chronic Lower Back Pain', 'Depression'],
        diagnosis: 'L4/L5 disc herniation with radiculopathy. Chronic lower back pain with secondary depression. Awaiting physiotherapy referral.',
        ecName: 'Niamh Fitzgerald', ecRel: 'Wife', ecPhone: '07533 678902',
        allergies: [{ substance: 'Codeine', reaction: 'Nausea and vomiting', severity: 'Mild' }],
      },
      {
        name: 'Isabelle Morrison', dob: '1979-03-25', gender: 'Female',
        phone: '07944 890123', bloodType: 'O+',
        address: '13 Blossom Close, Oxford, OX2 6HT',
        email: 'isabelle.morrison@gmail.com',
        conditions: ['Breast Cancer - Post-operative', 'Lymphoedema'],
        diagnosis: 'Left-sided breast cancer, Stage IIA, post wide local excision and sentinel node biopsy. Currently on adjuvant anastrozole. Under oncology follow-up.',
        ecName: 'George Morrison', ecRel: 'Husband', ecPhone: '07944 890124',
        allergies: [{ substance: 'Tamoxifen', reaction: 'Deep vein thrombosis', severity: 'Life-threatening' }],
      },
      {
        name: 'Noah Patel', dob: '2016-06-15', gender: 'Male',
        phone: '07611 012345', bloodType: 'B+',
        address: '56 Greenway Drive, Coventry, CV3 6ER',
        email: 'noah.patel.parent@gmail.com',
        conditions: ['Childhood Asthma', 'Allergic Rhinitis', 'Peanut Allergy'],
        diagnosis: 'Moderate persistent childhood asthma with seasonal rhinitis and confirmed peanut allergy. Carries EpiPen. On Clenil Modulite 100mcg BD.',
        ecName: 'Rajesh Patel', ecRel: 'Father', ecPhone: '07611 012346',
        allergies: [
          { substance: 'Peanuts', reaction: 'Anaphylaxis', severity: 'Life-threatening' },
          { substance: 'Tree nuts', reaction: 'Urticaria', severity: 'Moderate' },
        ],
      },
      {
        name: 'Grace Williams', dob: '1963-11-07', gender: 'Female',
        phone: '07722 567890', bloodType: 'A-',
        address: '78 Orchard Lane, Cardiff, CF10 3NB',
        email: 'grace.williams@yahoo.co.uk',
        conditions: ['Osteoporosis', 'Hypothyroidism', 'Vitamin D Deficiency'],
        diagnosis: 'Post-menopausal osteoporosis (T-score -2.8 at femoral neck). Primary hypothyroidism on levothyroxine 100mcg. Vitamin D supplementation ongoing.',
        ecName: 'Alan Williams', ecRel: 'Son', ecPhone: '07722 567891',
        allergies: [],
      },
    ];

    const patientRows: { id: string; name: string }[] = [];
    for (const p of patientDefs) {
      const r = await client.query(
        `INSERT INTO patients (
           name, address, conditions, diagnosis, "totalCost", "medicalHistory",
           date_of_birth, gender, phone, blood_type, email, allergies,
           emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
           "createdAt"
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
         RETURNING id, name`,
        [
          p.name, p.address, p.conditions, p.diagnosis, 0, [],
          p.dob, p.gender, p.phone, p.bloodType, p.email,
          JSON.stringify(p.allergies),
          p.ecName, p.ecRel, p.ecPhone,
        ]
      );
      patientRows.push({ id: r.rows[0].id, name: r.rows[0].name });
    }
    console.log(`  ${patientRows.length} patients\n`);

    // ── 5. Appointments ───────────────────────────────────────────────────────
    console.log('Seeding appointments...');

    const APPT_TIMES = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ];
    const APPT_TYPES  = ['In-Person', 'Video Call', 'Phone Call'];
    const APPT_REASONS = [
      'Annual health review', 'Follow-up consultation', 'Medication review',
      'Blood pressure monitoring', 'Diabetic annual review', 'Chest pain assessment',
      'Mental health check-in', 'Post-operative review', 'New patient registration',
      'Referral follow-up', 'Repeat prescription review', 'Vaccination appointment',
    ];

    // 30 appointments: 20 past (last 3 months), 10 future (next 2 weeks)
    // [patientIdx, doctorIdx, daysOffset, status]
    const apptDefs: [number, number, number, string][] = [
      [0,  0, -85, 'Completed'], [1,  1, -78, 'Completed'], [2,  8, -71, 'Completed'],
      [3,  3, -65, 'Cancelled'], [4,  1, -60, 'Completed'], [5,  0, -55, 'Completed'],
      [6,  6, -50, 'Completed'], [7,  7, -45, 'Cancelled'], [8,  1, -40, 'Completed'],
      [9,  0, -36, 'Completed'], [10, 7, -30, 'Completed'], [11, 5, -28, 'Completed'],
      [12, 6, -25, 'Completed'], [13, 1, -22, 'Completed'], [14, 4, -20, 'Cancelled'],
      [0,  0, -15, 'Completed'], [3,  3, -12, 'Completed'], [7,  7, -10, 'Completed'],
      [2,  8,  -7, 'Completed'], [5,  4,  -5, 'Confirmed'],
      // Future
      [1,  1,   2, 'Confirmed'], [4,  1,   3, 'Confirmed'], [6,  5,   4, 'Confirmed'],
      [8,  1,   5, 'Confirmed'], [9,  0,   6, 'Confirmed'], [11, 5,   7, 'Confirmed'],
      [12, 6,   8, 'Confirmed'], [13, 1,   9, 'Confirmed'], [14, 9,  10, 'Confirmed'],
      [0,  0,  12, 'Confirmed'],
    ];

    const usedSlots = new Set<string>();
    let apptCount = 0;
    for (const [pi, di, offset, status] of apptDefs) {
      const patient = patientRows[pi];
      const doctor  = doctorRows[di];
      const date    = offset >= 0 ? daysFromNow(offset) : daysAgo(Math.abs(offset));

      let time = '';
      for (const t of APPT_TIMES) {
        const key = `${doctor.id}|${date}|${t}`;
        if (!usedSlots.has(key)) { time = t; if (status !== 'Cancelled') usedSlots.add(key); break; }
      }
      if (!time) continue;

      await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, date, time, type, status, reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [patient.id, doctor.id, date, time, pick(APPT_TYPES), status, pick(APPT_REASONS)]
      );
      apptCount++;
    }
    console.log(`  ${apptCount} appointments\n`);

    // ── 6. Financial Tasks ────────────────────────────────────────────────────
    console.log('Seeding financial tasks...');

    const TASKS = [
      { desc: 'GP Consultation (15 minutes)',              cost: 85.00 },
      { desc: 'Specialist Consultation - Cardiology',      cost: 195.00 },
      { desc: 'Follow-up Appointment',                     cost: 65.00 },
      { desc: 'Telephone Consultation',                    cost: 45.00 },
      { desc: 'Video Consultation',                        cost: 55.00 },
      { desc: 'Full Blood Count (FBC)',                    cost: 28.00 },
      { desc: 'HbA1c Blood Test',                         cost: 32.00 },
      { desc: 'Echocardiogram',                           cost: 380.00 },
      { desc: 'Chest X-Ray',                              cost: 120.00 },
      { desc: 'MRI Scan - Lumbar Spine',                  cost: 750.00 },
      { desc: 'CT Scan - Thorax',                         cost: 650.00 },
      { desc: 'Thyroid Function Test',                    cost: 34.00 },
      { desc: 'Lipid Profile',                            cost: 28.00 },
      { desc: 'Ultrasound - Abdomen',                     cost: 220.00 },
      { desc: 'DEXA Bone Density Scan',                   cost: 180.00 },
      { desc: 'Wound dressing and care',                  cost: 45.00 },
      { desc: 'Influenza vaccination',                    cost: 25.00 },
      { desc: 'Blood pressure monitoring (24-hour)',      cost: 95.00 },
      { desc: 'Pulmonary Function Test (Spirometry)',     cost: 110.00 },
      { desc: 'ECG (12-lead)',                            cost: 75.00 },
      { desc: 'Compression therapy for lymphoedema',     cost: 85.00 },
      { desc: 'Joint injection - Knee',                  cost: 320.00 },
      { desc: 'Physiotherapy session (45 minutes)',       cost: 90.00 },
      { desc: 'Bone marrow biopsy',                      cost: 420.00 },
      { desc: 'Ophthalmology screening - Diabetic',      cost: 95.00 },
    ];

    let taskCount = 0;
    for (const p of patientRows) {
      const numTasks = range(2, 5);
      const shuffled = [...TASKS].sort(() => Math.random() - 0.5).slice(0, numTasks);
      let total = 0;
      for (const t of shuffled) {
        await client.query(
          `INSERT INTO tasks (patient_id, description, cost, created_at) VALUES ($1,$2,$3,$4)`,
          [p.id, t.desc, t.cost, daysBack(range(1, 90))]
        );
        total += t.cost;
        taskCount++;
      }
      await client.query(`UPDATE patients SET "totalCost" = $1 WHERE id = $2`, [total, p.id]);
    }
    console.log(`  ${taskCount} financial tasks\n`);

    // ── 7. Medical Images ─────────────────────────────────────────────────────
    console.log('Seeding medical images...');

    // Placeholder URLs pointing to real-world public sample medical images
    const IMAGES = [
      { type: 'X-Ray',     disease: 'Normal',         url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Chest_Xray_PA_3-8-2010.png/600px-Chest_Xray_PA_3-8-2010.png' },
      { type: 'X-Ray',     disease: 'Cardiomegaly',   url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Chest_Xray_PA_3-8-2010.png/600px-Chest_Xray_PA_3-8-2010.png' },
      { type: 'MRI',       disease: 'Normal',         url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/MRI_brain_sagittal_section.jpg/600px-MRI_brain_sagittal_section.jpg' },
      { type: 'CT Scan',   disease: 'Consolidation',  url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Chest_Xray_PA_3-8-2010.png/600px-Chest_Xray_PA_3-8-2010.png' },
      { type: 'Ultrasound', disease: 'Normal',        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Chest_Xray_PA_3-8-2010.png/600px-Chest_Xray_PA_3-8-2010.png' },
      { type: 'X-Ray',     disease: 'Pleural Effusion', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Chest_Xray_PA_3-8-2010.png/600px-Chest_Xray_PA_3-8-2010.png' },
    ];
    const IMAGE_NOTES = [
      'No acute cardiorespiratory pathology identified.',
      'Mild cardiomegaly noted. Echocardiogram recommended.',
      'Clear lung fields bilaterally. No pleural effusion.',
      'Right lower lobe consolidation consistent with pneumonia.',
      'Findings discussed with patient. Review in 6 weeks.',
      'Report forwarded to referring clinician.',
    ];
    // uploaded_by is a UUID column — use seeded staff IDs
    const UPLOADERS = staffRows.map(s => s.id);

    let imgCount = 0;
    for (let pi = 0; pi < patientRows.length; pi++) {
      const p = patientRows[pi];
      const numImages = range(2, 3);
      for (let i = 0; i < numImages; i++) {
        const img = IMAGES[(pi + i) % IMAGES.length];
        await client.query(
          `INSERT INTO medical_images (patient_id, uploaded_at, uploaded_by, type, disease_classification, image_url, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [p.id, daysBack(range(5, 80)), pick(UPLOADERS), img.type, img.disease, img.url, pick(IMAGE_NOTES)]
        );
        imgCount++;
      }
    }
    console.log(`  ${imgCount} medical images\n`);

    // ── 8. Vitals ─────────────────────────────────────────────────────────────
    console.log('Seeding vitals...');

    const VITALS = [
      { bps: 128, bpd: 82,  hr: 72, temp: 36.6, spo2: 98.0, wt: 74.2, ht: 162.0 },
      { bps: 145, bpd: 92,  hr: 88, temp: 37.1, spo2: 96.5, wt: 92.5, ht: 175.0 },
      { bps: 118, bpd: 76,  hr: 68, temp: 36.8, spo2: 99.0, wt: 61.0, ht: 168.0 },
      { bps: 156, bpd: 98,  hr: 95, temp: 36.5, spo2: 94.0, wt: 88.0, ht: 170.0 },
      { bps: 112, bpd: 72,  hr: 64, temp: 36.7, spo2: 99.5, wt: 58.3, ht: 165.0 },
      { bps: 138, bpd: 86,  hr: 78, temp: 36.9, spo2: 97.5, wt: 82.0, ht: 178.0 },
      { bps: 122, bpd: 78,  hr: 74, temp: 36.6, spo2: 98.5, wt: 67.5, ht: 160.0 },
      { bps: 162, bpd: 102, hr: 102, temp: 37.3, spo2: 92.0, wt: 98.0, ht: 172.0 },
      { bps: 108, bpd: 68,  hr: 60, temp: 36.5, spo2: 99.0, wt: 55.0, ht: 163.0 },
      { bps: 134, bpd: 84,  hr: 82, temp: 36.8, spo2: 96.0, wt: 79.0, ht: 169.0 },
    ];
    const VITALS_RECORDERS = ['Dr. James Okafor', 'Dr. Sarah Chen', 'Emma Clarke'];

    let vitalsCount = 0;
    for (let pi = 0; pi < patientRows.length; pi++) {
      const p = patientRows[pi];
      const v = VITALS[pi % VITALS.length];
      await client.query(
        `INSERT INTO vitals
           (patient_id, recorded_at, recorded_by,
            blood_pressure_systolic, blood_pressure_diastolic,
            heart_rate, temperature, oxygen_saturation, weight, height)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [p.id, daysBack(range(1, 30)), pick(VITALS_RECORDERS),
         v.bps, v.bpd, v.hr, v.temp, v.spo2, v.wt, v.ht]
      );
      vitalsCount++;
    }
    console.log(`  ${vitalsCount} vitals records\n`);

    // ── 9. Prescriptions ──────────────────────────────────────────────────────
    console.log('Seeding prescriptions...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id         UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        prescribed_by      UUID        REFERENCES staff(id) ON DELETE SET NULL,
        prescribed_by_name TEXT,
        medications        JSONB       NOT NULL DEFAULT '[]',
        advice             TEXT,
        prescribed_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const doc001 = byCode('DOC-001');

    const prescriptionDefs = [
      {
        pi: 0,
        meds: [
          { name: 'Metformin 500mg',   dosage: '500mg',  frequency: 'Twice daily with meals',    duration: '3 months', instructions: 'Take with food to reduce GI side effects' },
          { name: 'Amlodipine 5mg',    dosage: '5mg',    frequency: 'Once daily',                duration: '3 months', instructions: 'Take at the same time each day' },
          { name: 'Atorvastatin 40mg', dosage: '40mg',   frequency: 'Once daily at night',       duration: '3 months', instructions: 'Best taken in the evening' },
        ],
        advice: 'Maintain low-salt diet. Monitor blood glucose daily. Exercise 30 minutes daily.',
      },
      {
        pi: 1,
        meds: [
          { name: 'Salbutamol 100mcg Inhaler',      dosage: '2 puffs', frequency: 'As required (max 8 puffs/day)', duration: 'Ongoing',       instructions: 'Use spacer device for best delivery' },
          { name: 'Beclomethasone 200mcg Inhaler',  dosage: '2 puffs', frequency: 'Twice daily',                   duration: '3 months',      instructions: 'Rinse mouth after each use' },
          { name: 'Cetirizine 10mg',                dosage: '10mg',    frequency: 'Once daily',                    duration: 'Seasonal use',  instructions: 'May cause drowsiness' },
        ],
        advice: 'Avoid known asthma triggers. Carry reliever inhaler at all times.',
      },
      {
        pi: 2,
        meds: [
          { name: 'Sertraline 50mg',   dosage: '50mg', frequency: 'Once daily in the morning', duration: '6 months', instructions: 'Do not stop suddenly - taper under medical supervision' },
          { name: 'Propranolol 10mg',  dosage: '10mg', frequency: 'Twice daily PRN',           duration: '3 months', instructions: 'For acute anxiety episodes only' },
        ],
        advice: 'Continue weekly CBT sessions. Avoid alcohol. Contact GP if suicidal ideation develops.',
      },
      {
        pi: 3,
        meds: [
          { name: 'Tiotropium 18mcg Inhaler', dosage: '1 puff', frequency: 'Once daily',              duration: 'Ongoing', instructions: 'Use HandiHaler device' },
          { name: 'Furosemide 40mg',          dosage: '40mg',   frequency: 'Once daily in morning',   duration: 'Ongoing', instructions: 'Monitor weight daily; report gain >2kg in 2 days' },
          { name: 'Ramipril 5mg',             dosage: '5mg',    frequency: 'Once daily',              duration: 'Ongoing', instructions: 'Monitor blood pressure regularly' },
        ],
        advice: 'Fluid restriction 1.5L/day. Weigh daily. Seek urgent care if breathlessness worsens.',
      },
      {
        pi: 6,
        meds: [
          { name: 'Methotrexate 15mg', dosage: '15mg', frequency: 'Once weekly (Monday)',   duration: 'Ongoing', instructions: 'Take folic acid 5mg on all other days' },
          { name: 'Folic Acid 5mg',    dosage: '5mg',  frequency: 'Once daily (not Monday)', duration: 'Ongoing', instructions: 'Reduce methotrexate side effects' },
        ],
        advice: 'Monthly FBC and LFT monitoring required. Avoid alcohol. Report any mouth ulcers or breathlessness immediately.',
      },
      {
        pi: 9,
        meds: [
          { name: 'Apixaban 5mg',      dosage: '5mg',  frequency: 'Twice daily',  duration: 'Ongoing', instructions: 'Do not miss doses; report any unusual bleeding' },
          { name: 'Bisoprolol 2.5mg',  dosage: '2.5mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'Do not stop suddenly' },
          { name: 'Dapagliflozin 10mg', dosage: '10mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'Maintain adequate hydration' },
        ],
        advice: 'Daily weight monitoring. Attend cardiology clinic every 3 months.',
      },
      {
        pi: 14,
        meds: [
          { name: 'Levothyroxine 100mcg',  dosage: '100mcg', frequency: 'Once daily (30 min before breakfast)', duration: 'Ongoing', instructions: 'Do not take with calcium supplements' },
          { name: 'Alendronate 70mg',      dosage: '70mg',   frequency: 'Once weekly (fasted)',                 duration: 'Ongoing', instructions: 'Remain upright for 30 minutes after taking' },
          { name: 'Colecalciferol 1000 IU', dosage: '1000 IU', frequency: 'Once daily with food',             duration: 'Ongoing', instructions: 'Vitamin D supplementation' },
        ],
        advice: 'Annual thyroid function test. DEXA scan repeat in 2 years. Weight-bearing exercise encouraged.',
      },
    ];

    let rxCount = 0;
    for (const rx of prescriptionDefs) {
      await client.query(
        `INSERT INTO prescriptions (patient_id, prescribed_by, prescribed_by_name, medications, advice, prescribed_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          patientRows[rx.pi].id,
          doc001.id, doc001.name,
          JSON.stringify(rx.meds),
          rx.advice,
          daysBack(range(5, 45)),
        ]
      );
      rxCount++;
    }
    console.log(`  ${rxCount} prescriptions\n`);

    await client.query('COMMIT');

    console.log('----------------------------------------');
    console.log('Seed complete!\n');
    console.log('  Default PIN for all staff: 000000');
    console.log('  Staff codes:');
    for (const s of staffRows) {
      console.log(`    ${s.code.padEnd(8)} ${s.name}`);
    }
    console.log();

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nSeed failed - transaction rolled back');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
