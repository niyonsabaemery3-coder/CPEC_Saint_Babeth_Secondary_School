const express = require("express");
const pool = require("../db");
const { requireAdminOrTeacher, requireAnyAuth } = require("../middleware/auth");
const { SCHOOL_CLASS_VALUES } = require("../constants/academics");
const { logAction } = require("../utils/audit");

const router = express.Router();

function actorName(auth) {
  return auth.username || auth.email || null;
}

/** Subjects assigned to a class, each with its max score. */
async function getClassSubjects(schoolClass) {
  const [rows] = await pool.query(
    `SELECT s.id AS subject_id, s.name, s.code, s.max_score
     FROM class_subjects cs
     JOIN subjects s ON s.id = cs.subject_id
     WHERE cs.school_class = ?
     ORDER BY s.name ASC`,
    [schoolClass]
  );
  return rows.map((r) => ({ subjectId: r.subject_id, name: r.name, code: r.code, maxScore: Number(r.max_score) }));
}

/** Resolves a termId, falling back to whichever term is flagged "current". */
async function resolveTermId(termId) {
  if (termId) return Number(termId);
  const [[current]] = await pool.query("SELECT id FROM exam_terms WHERE is_current = 1 LIMIT 1");
  return current ? current.id : null;
}

/**
 * Builds one student's full report card for a term: every subject their
 * class takes, their score in each (or null if not entered yet), the total,
 * the percentage average, and their rank among classmates who also have at
 * least one mark recorded for the same term.
 *
 * Ranking is done in JS rather than SQL because it needs the same per-class
 * subject/max-score list as the student's own report — keeping the ranking
 * formula (percentage of total possible marks) identical for everyone being
 * compared is what makes the rank meaningful.
 */
async function computeStudentReport(studentId, termId) {
  const [[student]] = await pool.query(
    "SELECT id, full_name, email, school_class FROM student_accounts WHERE id = ?",
    [studentId]
  );
  if (!student) return null;

  const resolvedTermId = await resolveTermId(termId);
  const subjectList = await getClassSubjects(student.school_class);
  const studentInfo = {
    id: student.id,
    fullName: student.full_name,
    email: student.email,
    schoolClass: student.school_class,
  };

  if (!resolvedTermId) {
    return {
      student: studentInfo,
      term: null,
      subjects: subjectList.map((s) => ({ ...s, score: null })),
      totalScore: 0,
      totalMax: 0,
      average: null,
      rank: null,
      classSize: 0,
    };
  }

  const [[term]] = await pool.query("SELECT * FROM exam_terms WHERE id = ?", [resolvedTermId]);

  const [marks] = await pool.query(
    "SELECT subject_id, score FROM student_marks WHERE student_id = ? AND term_id = ?",
    [studentId, resolvedTermId]
  );
  const scoreBySubject = new Map(marks.map((m) => [m.subject_id, Number(m.score)]));

  const subjects = subjectList.map((s) => ({
    ...s,
    score: scoreBySubject.has(s.subjectId) ? scoreBySubject.get(s.subjectId) : null,
  }));

  const entered = subjects.filter((s) => s.score != null);
  const totalScore = entered.reduce((sum, s) => sum + s.score, 0);
  const totalMax = entered.reduce((sum, s) => sum + s.maxScore, 0);
  const average = totalMax > 0 ? Number(((totalScore / totalMax) * 100).toFixed(2)) : null;

  // Rank within the class: same percentage-of-total-possible formula for
  // every classmate who has at least one mark recorded this term.
  const [classmates] = await pool.query(
    "SELECT id FROM student_accounts WHERE school_class = ? AND status != 'deactivated'",
    [student.school_class]
  );
  const maxBySubject = new Map(subjectList.map((s) => [s.subjectId, s.maxScore]));
  const percentages = [];
  for (const mate of classmates) {
    const [mateMarks] = await pool.query(
      "SELECT subject_id, score FROM student_marks WHERE student_id = ? AND term_id = ?",
      [mate.id, resolvedTermId]
    );
    if (mateMarks.length === 0) continue;
    const mateTotalScore = mateMarks.reduce((sum, m) => sum + Number(m.score), 0);
    const mateTotalMax = mateMarks.reduce((sum, m) => sum + (maxBySubject.get(m.subject_id) || 0), 0);
    if (mateTotalMax > 0) percentages.push({ studentId: mate.id, pct: (mateTotalScore / mateTotalMax) * 100 });
  }
  percentages.sort((a, b) => b.pct - a.pct);

  let rank = null;
  if (average != null) {
    let position = 1;
    for (let i = 0; i < percentages.length; i++) {
      if (i > 0 && percentages[i].pct < percentages[i - 1].pct) position = i + 1;
      if (percentages[i].studentId === Number(studentId)) {
        rank = position;
        break;
      }
    }
  }

  return {
    student: studentInfo,
    term: term ? { id: term.id, name: term.name, schoolYear: term.school_year } : null,
    subjects,
    totalScore,
    totalMax,
    average,
    rank,
    classSize: percentages.length,
  };
}

// Admin, the student themselves, or a teacher assigned to that student's
// class may view a report card.
router.get("/report/:studentId", requireAnyAuth, async (req, res) => {
  const { studentId } = req.params;
  const { termId } = req.query;

  if (req.auth.role === "student" && Number(req.auth.id) !== Number(studentId)) {
    return res.status(403).json({ error: "You can only view your own report." });
  }

  const report = await computeStudentReport(studentId, termId);
  if (!report) return res.status(404).json({ error: "Student not found." });

  if (req.auth.role === "teacher") {
    const [[assignment]] = await pool.query(
      "SELECT id FROM class_subjects WHERE school_class = ? AND teacher_account_id = ? LIMIT 1",
      [report.student.schoolClass, req.auth.id]
    );
    if (!assignment) return res.status(403).json({ error: "You do not teach this student's class." });
  }

  res.json(report);
});

// Admin + Teacher: the mark-entry sheet for one class/subject/term — every
// student in that class with their current score (or null if not entered).
router.get("/roster", requireAdminOrTeacher, async (req, res) => {
  const { schoolClass, subjectId, termId } = req.query;
  if (!schoolClass || !subjectId) {
    return res.status(400).json({ error: "schoolClass and subjectId are required." });
  }
  if (!SCHOOL_CLASS_VALUES.includes(schoolClass)) {
    return res.status(400).json({ error: "Unknown class." });
  }

  if (req.auth.role === "teacher") {
    const [[assignment]] = await pool.query(
      "SELECT id FROM class_subjects WHERE school_class = ? AND subject_id = ? AND teacher_account_id = ?",
      [schoolClass, subjectId, req.auth.id]
    );
    if (!assignment) {
      return res.status(403).json({ error: "You are not assigned to teach this subject for this class." });
    }
  }

  const resolvedTermId = await resolveTermId(termId);
  if (!resolvedTermId) {
    return res.status(400).json({ error: "No exam term is set yet. Ask the admin to create one first." });
  }

  const [[subject]] = await pool.query("SELECT * FROM subjects WHERE id = ?", [subjectId]);
  if (!subject) return res.status(404).json({ error: "Subject not found." });

  const [students] = await pool.query(
    "SELECT id, full_name, email FROM student_accounts WHERE school_class = ? AND status != 'deactivated' ORDER BY full_name ASC",
    [schoolClass]
  );
  const studentIds = students.length ? students.map((s) => s.id) : [0];
  const [marks] = await pool.query(
    `SELECT student_id, score FROM student_marks WHERE subject_id = ? AND term_id = ? AND student_id IN (${studentIds.map(() => "?").join(",")})`,
    [subjectId, resolvedTermId, ...studentIds]
  );
  const scoreByStudent = new Map(marks.map((m) => [m.student_id, Number(m.score)]));

  res.json({
    subject: { id: subject.id, name: subject.name, code: subject.code, maxScore: Number(subject.max_score) },
    termId: resolvedTermId,
    students: students.map((s) => ({
      studentId: s.id,
      fullName: s.full_name,
      email: s.email,
      score: scoreByStudent.has(s.id) ? scoreByStudent.get(s.id) : null,
    })),
  });
});

// Admin + Teacher: save a whole class/subject/term sheet in one request.
// entries: [{ studentId, score }]. A null/empty score clears that mark.
// Every entry is validated before anything is written, so a bad row never
// leaves the sheet half-saved.
router.post("/roster", requireAdminOrTeacher, async (req, res) => {
  const { schoolClass, subjectId, termId, entries } = req.body || {};
  if (!schoolClass || !subjectId || !termId || !Array.isArray(entries)) {
    return res.status(400).json({ error: "schoolClass, subjectId, termId and entries are required." });
  }
  if (!SCHOOL_CLASS_VALUES.includes(schoolClass)) {
    return res.status(400).json({ error: "Unknown class." });
  }

  if (req.auth.role === "teacher") {
    const [[assignment]] = await pool.query(
      "SELECT id FROM class_subjects WHERE school_class = ? AND subject_id = ? AND teacher_account_id = ?",
      [schoolClass, subjectId, req.auth.id]
    );
    if (!assignment) {
      return res.status(403).json({ error: "You are not assigned to teach this subject for this class." });
    }
  }

  const [[subject]] = await pool.query("SELECT * FROM subjects WHERE id = ?", [subjectId]);
  if (!subject) return res.status(404).json({ error: "Subject not found." });
  const [[term]] = await pool.query("SELECT id FROM exam_terms WHERE id = ?", [termId]);
  if (!term) return res.status(404).json({ error: "Term not found." });

  const maxScore = Number(subject.max_score);
  const requestedIds = entries.map((e) => Number(e.studentId)).filter(Boolean);
  if (requestedIds.length === 0) return res.status(400).json({ error: "No students provided." });

  const [validStudents] = await pool.query(
    `SELECT id FROM student_accounts WHERE school_class = ? AND id IN (${requestedIds.map(() => "?").join(",")})`,
    [schoolClass, ...requestedIds]
  );
  const validIds = new Set(validStudents.map((s) => s.id));

  // Pass 1 — validate every row up front.
  const toSave = [];
  const toClear = [];
  for (const entry of entries) {
    const studentId = Number(entry.studentId);
    if (!validIds.has(studentId)) {
      return res.status(400).json({ error: `Student ${entry.studentId} is not in class ${schoolClass}.` });
    }
    if (entry.score === null || entry.score === "" || entry.score === undefined) {
      toClear.push(studentId);
      continue;
    }
    const score = Number(entry.score);
    if (!Number.isFinite(score) || score < 0 || score > maxScore) {
      return res.status(400).json({
        error: `Invalid score "${entry.score}" for student ${studentId}. Must be between 0 and ${maxScore}.`,
      });
    }
    toSave.push({ studentId, score });
  }

  // Pass 2 — write, now that everything is known to be valid.
  for (const studentId of toClear) {
    await pool.query(
      "DELETE FROM student_marks WHERE student_id = ? AND subject_id = ? AND term_id = ?",
      [studentId, subjectId, termId]
    );
  }
  for (const { studentId, score } of toSave) {
    await pool.query(
      `INSERT INTO student_marks (student_id, subject_id, term_id, score, entered_by_teacher_id)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score), entered_by_teacher_id = VALUES(entered_by_teacher_id)`,
      [studentId, subjectId, termId, score, req.auth.role === "teacher" ? req.auth.id : null]
    );
  }

  await logAction({
    actorRole: req.auth.role,
    actorId: req.auth.id,
    actorName: actorName(req.auth),
    action: "enter_marks",
    entityType: "student_marks",
    entityId: `${schoolClass}:${subjectId}:${termId}`,
    details: { schoolClass, subjectId, termId, saved: toSave.length, cleared: toClear.length },
  });

  res.json({ message: "Marks saved.", saved: toSave.length, cleared: toClear.length });
});

// Admin + Teacher (own class only): every student in a class with their
// total/average/rank for a term — the printable class results sheet.
router.get("/class-report", requireAdminOrTeacher, async (req, res) => {
  const { schoolClass, termId } = req.query;
  if (!schoolClass) return res.status(400).json({ error: "schoolClass is required." });
  if (!SCHOOL_CLASS_VALUES.includes(schoolClass)) {
    return res.status(400).json({ error: "Unknown class." });
  }
  if (req.auth.role === "teacher") {
    const [[assignment]] = await pool.query(
      "SELECT id FROM class_subjects WHERE school_class = ? AND teacher_account_id = ? LIMIT 1",
      [schoolClass, req.auth.id]
    );
    if (!assignment) return res.status(403).json({ error: "You do not teach this class." });
  }

  const [students] = await pool.query(
    "SELECT id FROM student_accounts WHERE school_class = ? AND status != 'deactivated' ORDER BY full_name ASC",
    [schoolClass]
  );

  const reports = [];
  for (const s of students) {
    const report = await computeStudentReport(s.id, termId);
    if (report) reports.push(report);
  }
  reports.sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

  res.json(reports);
});

module.exports = router;
