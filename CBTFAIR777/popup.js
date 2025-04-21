
document.getElementById('fetch-jobs').addEventListener('click', async () => {
    // const response = await fetch('https://your-laravel-platform.com/api/jobs', {
    //     headers: { 'Authorization': 'Bearer YOUR_API_TOKEN' }
    // });
    // // const jobs = await response.json();

    const jobs =[
        {
            "apply_link": "https://in.linkedin.com/jobs/view/php-develoeper-rajesh-test-job-at-calltek-3931994476?utm_campaign=google_jobs_apply&utm_source=google_jobs_apply&utm_medium=organic",
            "user_details": {
                "id": 1,
                "user_id": 2,
                "name": "Kalvani Nurmahmad",
                "email": "mr.kalvani@gmail.com",
                "phone_number": "9811563439",
                "github_url": "https://github.com/keshavpro1",
                "linkedin_url": "https://www.linkedin.com/in/bhavin-patel-28206030a/",
                "city": "Rajkot",
                "state": "Gujarat",
                "country": "IN",
                "zip_code": 360006,
                "job_title": "PHP Develper",
                "age": 34,
                "education": "High School",
                "experience": "Fresher",
                "language": "English, Hindi",
                "about_info": "I m senior PHP developer with 5+ year experience",
                "created_at": "2024-12-16T09:37:14.000000Z",
                "updated_at": "2024-12-24T11:20:22.000000Z",
                "educations": [
                    {
                        "id": 19,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "PGDCA",
                        "academy_name": "HArivandna",
                        "passing_year": 2019,
                        "city": null,
                        "state": null,
                        "country": null,
                        "description": "Testese",
                        "created_at": "2024-12-16T11:37:52.000000Z",
                        "updated_at": "2024-12-16T11:37:52.000000Z"
                    },
                    {
                        "id": 20,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "B.A",
                        "academy_name": "J.K Ram",
                        "passing_year": 2015,
                        "city": "rajkot",
                        "state": "gujart",
                        "country": "IN",
                        "description": "Testese",
                        "created_at": "2024-12-16T11:37:52.000000Z",
                        "updated_at": "2024-12-25T07:33:25.000000Z"
                    }
                ],
                "skills": [
                    {
                        "id": 20,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "PHP",
                        "years_of_experience": 5,
                        "created_at": "2024-12-16T11:40:41.000000Z",
                        "updated_at": "2024-12-24T11:01:05.000000Z"
                    },
                    {
                        "id": 22,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "JAVACRIPT",
                        "years_of_experience": 0,
                        "created_at": "2024-12-16T11:40:41.000000Z",
                        "updated_at": "2024-12-24T11:01:05.000000Z"
                    },
                    {
                        "id": 23,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "NODEJS",
                        "years_of_experience": 0,
                        "created_at": "2024-12-18T09:13:09.000000Z",
                        "updated_at": "2024-12-24T11:01:05.000000Z"
                    },
                    {
                        "id": 24,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "CSS",
                        "years_of_experience": 0,
                        "created_at": "2024-12-18T09:13:09.000000Z",
                        "updated_at": "2024-12-24T11:01:05.000000Z"
                    },
                    {
                        "id": 25,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "HTML",
                        "years_of_experience": 0,
                        "created_at": "2024-12-18T09:13:09.000000Z",
                        "updated_at": "2024-12-24T11:01:05.000000Z"
                    },
                    {
                        "id": 26,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "REACTJS",
                        "years_of_experience": 0,
                        "created_at": "2024-12-18T09:13:09.000000Z",
                        "updated_at": "2024-12-24T11:01:05.000000Z"
                    },
                    {
                        "id": 27,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "Laravel",
                        "years_of_experience": 5,
                        "created_at": "2024-12-24T11:02:28.000000Z",
                        "updated_at": "2024-12-24T11:02:28.000000Z"
                    }
                ],
                "experiences": [
                    {
                        "id": 23,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "PHP Develper",
                        "joining_date": "2024-12-16",
                        "end_date": "2024-12-19",
                        "currently_work_here": 0,
                        "company_name": "test",
                        "company_city": "RAJKOT",
                        "company_state": "gujarat",
                        "company_country": "IN",
                        "description": "teste",
                        "created_at": "2024-12-16T11:37:52.000000Z",
                        "updated_at": "2024-12-25T07:33:25.000000Z"
                    },
                    {
                        "id": 24,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "title": "Node Develper",
                        "joining_date": "2024-12-16",
                        "end_date": "2024-12-19",
                        "currently_work_here": 0,
                        "company_name": "test",
                        "company_city": null,
                        "company_state": null,
                        "company_country": null,
                        "description": "teste",
                        "created_at": "2024-12-16T11:37:52.000000Z",
                        "updated_at": "2024-12-25T07:33:25.000000Z"
                    }
                ],
                "resume_uploads": [
                    {
                        "id": 6,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "name": "application.docx",
                        "type": "application/vnd.open",
                        "size": "10879",
                        "extention": "docx",
                        "path": "resume/MOyfOChzdoxCm9h8g9SN3psapp6SATaFPuk6oi2p.docx",
                        "created_at": "2024-12-16T12:32:56.000000Z",
                        "updated_at": "2024-12-16T12:32:56.000000Z",
                        "path_url": "http://localhost:8000/uploads/resume/MOyfOChzdoxCm9h8g9SN3psapp6SATaFPuk6oi2p.docx"
                    },
                    {
                        "id": 7,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "name": "document (5).pdf",
                        "type": "application/pdf",
                        "size": "5842",
                        "extention": "pdf",
                        "path": "resume/xoBrsQkUJRmz5GCcRjGgLaJAuAMYoEGXPvrvs3I5.pdf",
                        "created_at": "2024-12-18T10:38:36.000000Z",
                        "updated_at": "2024-12-18T10:38:36.000000Z",
                        "path_url": "http://localhost:8000/uploads/resume/xoBrsQkUJRmz5GCcRjGgLaJAuAMYoEGXPvrvs3I5.pdf"
                    },
                    {
                        "id": 8,
                        "user_id": 2,
                        "student_resume_id": 1,
                        "name": "optimized-resume.pdf",
                        "type": "application/pdf",
                        "size": "6000",
                        "extention": "pdf",
                        "path": "resume/q7hAmHusK8BO3V3YuJu76zrUGmpKniKThV06jhu7FIr83.pdf",
                        "created_at": "2024-12-18T10:52:03.000000Z",
                        "updated_at": "2024-12-18T10:52:03.000000Z",
                        "path_url": "http://localhost:8000/uploads/resume/q7hAmHusK8BO3V3YuJu76zrUGmpKniKThV06jhu7FIr83.pdf"
                    }
                ]
            }
        }
    ]


    chrome.storage.local.set({ jobs }, () => {
        alert('Jobs fetched successfully!');
    });
});

document.getElementById('start-apply').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startApplying' });
});
