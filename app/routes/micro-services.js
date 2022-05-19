"use strict";

module.exports = function (app) {
  const basePath = "../controllers/classroom";
  const courseController = require(basePath + "/course");
  const teacherController = require(basePath + "/teacher");
  const studentController = require(basePath + "/student");
  const guardianController = require(basePath + "/guardian");
  const courseWorkController = require(basePath + "/courseWork");
  const courseWorkSubmissionController = require(basePath + "/courseWorkSubmission");
  const sheetController = require("../controllers/sheet");

  app.route("/micro-services/classroom/courses/sync").get(courseController.extSyncCourses);
  app.route("/micro-services/classroom/teachers/sync").get(teacherController.extSyncTeachers);
  app.route("/micro-services/classroom/teachers/sync/:courseId").get(teacherController.extSyncTeachersByCourseId);
  app.route("/micro-services/classroom/students/sync").get(studentController.extSyncStudents);
  app.route("/micro-services/classroom/students/sync/:courseId").get(studentController.extSyncStudentsByCourseId);
  //app.route("/micro-services/classroom/guardians/sync").get(guardianController.extSyncGuardians);
  //app.route("/micro-services/classroom/students/sync/:studentId/guardians").get(guardianController.extSyncGuardiansByStudentId);
  app.route("/micro-services/classroom/course-works/sync").get(courseWorkController.extSyncCourseWorks);
  app.route("/micro-services/classroom/course-works/sync/:courseId").get(courseWorkController.extSyncCourseWorksByCourseId);
  app.route('/micro-services/classroom/course-work-submissions/sync')
    .get(courseWorkSubmissionController.extSyncCourseWorkSubmissions);
  app.route('/micro-services/classroom/course-work-submissions/sync/:courseId')
    .get(courseWorkSubmissionController.extSyncCourseWorkSubmissionsByCourseId);
  app.route("/micro-services/sheets").post(sheetController.usageDataSheet);
};
