const pool = require("../../config/database");
const jwt = require('jsonwebtoken');
const bcrypt=require('bcrypt');
const { query } = require("express");
// Generate a 6-digit OTP
const userGeneratedOTP = () => Math.floor(100000 + Math.random() * 900000);
// Store OTP in memory (valid for 1 min)
const userOtpStore = new Map();
const companyGeneratedOTP = () => Math.floor(100000 + Math.random() * 900000);
const companyOtpStore = new Map();

module.exports = {
    getCategory:(limit, offset, callBack) => {
        pool.query(
            `select * from job_category LIMIT ? OFFSET ? `,
            [limit, offset],
            (error, results, fields) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    getTotalCategories: (callBack) => {
        pool.query(
            `SELECT COUNT(*) AS total FROM job_category`,
            (error, results) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results[0]); 
            }
        );
    },
    addCategory:(data,callBack) => {
        pool.query(
            `insert into job_category(categoryname,imageUrl) values (?, ?)`,
            [data.categoryname,data.imageUrl],
            (error, results, fields) => {
                if (error) {
                   return callBack(error);
                }
                return callBack(null, results);
                }
        );
    },
    checkIsCategoryExist: (categoryname, callBack) => {
        pool.query(
          `SELECT jobcategory_id, imageUrl FROM job_category WHERE categoryname = ?`,
          [categoryname],
          (error, results) => {
            if (error) {
              return callBack(error);
            }
            return callBack(null, results);
          }
        );
      },
    addSubcategory: (data, callBack) => {
        pool.query(
            `INSERT INTO job_subcategory( jobcategory_id, imageUrl, jobtitle, companyname, job_location, salary, date, jobtype) values (?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.jobcategory_id,data.imageUrl,data.jobtitle,data.companyname,data.job_location,data.salary,data.date,data.jobtype],
            (error, results, fields) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    getSubcategory: (limit, offset, callBack) => {
        const limitedQuery = `SELECT job_subcategory.*,
                              job_posting.employeetype,
                              job_posting.experience
                              from job_subcategory
                              join job_posting
                              on job_subcategory.jobsubcategory_id = job_posting.jobsubcategory_id
                              where job_posting.jobposting_status = 'approved'
                              group by job_subcategory.jobsubcategory_id, job_posting.employeetype, job_posting.experience
                              LIMIT ? OFFSET ?`;
    
        const totalRecordsQuery = 
        `
        SELECT COUNT(DISTINCT job_subcategory.jobsubcategory_id) AS totalCount
        FROM job_subcategory
        JOIN job_posting 
        ON job_subcategory.jobsubcategory_id = job_posting.jobsubcategory_id
        WHERE job_posting.jobposting_status = 'approved'`;
    
        pool.query(limitedQuery, [limit, offset], (error, limitedResults) => {
            if (error) {
                return callBack(error);
            }
            const cleanedResults = limitedResults.map((row) => ({
                ...row,
                employeetype: row.employeetype.replace(/\\|"/g, '')
            }));
            pool.query(totalRecordsQuery, (countError, countResults) => {
                if (countError) {
                    return callBack(countError);
                }
                const totalCount = countResults[0].totalCount;
                return callBack(null, { data: cleanedResults, totalCount: totalCount });
            });
        });
    },
    
    getSubcategoriesByCategory: (jobcategory_id, limit, offset, callBack) => {
        pool.query(
            `SELECT * FROM job_subcategory 
             WHERE jobcategory_id = ? 
             AND jobsubcategory_id IN 
                 (SELECT DISTINCT jobsubcategory_id FROM job_posting WHERE jobposting_status = 'approved')
             LIMIT ? OFFSET ?`,
            [jobcategory_id, limit, offset],
            (error, results) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    
    getJobpostingBySubcategories: (jobsubcategory_id, limit, offset, callBack) => {
        pool.query(
            `SELECT * FROM job_posting 
             WHERE jobsubcategory_id = ? 
             AND jobposting_status = 'approved' 
             LIMIT ? OFFSET ?`,
            [jobsubcategory_id, limit, offset],
            (error, results) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    updateJobStatusByAdmin: (jobposting_id, jobposting_status, callBack) => {
        pool.query(
            `UPDATE job_posting SET jobposting_status = ? WHERE jobposting_id = ?`,
            [jobposting_status, jobposting_id],
            (error, results) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    filterSubcategoriesService: (categoryId, jobtitle, job_location, employeetype, experience, callBack) => {
        let query = `
            SELECT js.*, jp.job_location, jp.employeetype, jp.experience
            FROM job_subcategory js
            JOIN job_posting jp ON js.jobsubcategory_id = jp.jobsubcategory_id       
            WHERE js.jobcategory_id = ?`;
    
        let queryParams = [categoryId];
    
        if (jobtitle) {
            query += ` AND LOWER(js.jobtitle) LIKE ?`;
            queryParams.push(`%${jobtitle.toLowerCase()}%`);
        }
    
        if (job_location) {
            query += ` AND LOWER(TRIM(jp.job_location)) LIKE ?`;
            queryParams.push(`%${job_location.toLowerCase()}%`);
        }
    
        // if (employeetype) {
        //     query += ` AND jp.employeetype LIKE ?`;
        //     queryParams.push(`%${employeetype}%`);
        // }
    
        // if (experience) {
        //     query += ` AND jp.experience = ?`;
        //     queryParams.push(experience);
        // }
    
        // console.log("Executing Query:", query);
        // console.log("Query Params:", queryParams);
    
        pool.query(query, queryParams, (error, results) => {
            if (error) {
                return callBack(error, null);
            }
            return callBack(null, results);
        });
    },
    addJobposting: (data, callBack) => {
        const formatExperience = (experience) => {
            if (Array.isArray(experience)) {
                // Join multiple experiences with comma separation
                return experience.map(exp => exp.trim()).join(', ');
            } else if (typeof experience === 'string') {
                return experience.trim();
            }
            return experience;
        };
        
        // Find company_id using company name
        pool.query('SELECT company_id FROM company_register WHERE company_name = ?', [data.companyname], (error, companyResults) => {
            if (error) {
                return callBack(error);
            }

            if (companyResults.length === 0) {
                return callBack({ message: 'Company not found!' });
            }

            const company_id = companyResults[0].company_id;

            // Insert job posting along with company_id
            pool.query(
                `INSERT INTO job_posting (jobcategory_id, jobsubcategory_id, company_id, dateposted,expiredate, companyname,company_website,vacancy_required, jobtitle,imageUrl, employeetype, qualifications, experience, salary, skillsrequired, jobdescription, job_location, keyresponse_1, keyresponse_2, skills_1, skills_2,jobposting_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,'pending' )`,
                [
                    data.jobcategory_id,
                    data.jobsubcategory_id, 
                    company_id,
                    data.dateposted,
                    data.expiredate,
                    data.companyname,
                    data.company_website,
                    data.vacancy_required,
                    data.jobtitle,
                    data.imageUrl,
                    JSON.stringify(data.employeetype),
                    data.qualifications,
                    formatExperience(data.experience),
                    data.salary,
                    data.skillsrequired,
                    data.jobdescription,
                    data.job_location,
                    data.keyresponse_1,
                    data.keyresponse_2 || '',
                    data.skills_1 || '', 
                    data.skills_2 || '' ,
                ],
                (error, results) => {
                    if (error) {
                        return callBack(error);
                    }
                    return callBack(null, results);
                }
            );
        });
    },
    checkIsCompanyExist:(company_name, callBack)=>{
        pool.query('SELECT * FROM company_register WHERE company_name = ?', [company_name], (error, results) => {
            if (error) {
              return callBack(error, null);
            }
            return callBack(null, results);
          });
    },
    getJobposting: (limit, offset, callBack) => {
        pool.query(
            `SELECT jp.*, cr.email_id 
             FROM job_posting jp
             JOIN company_register cr ON jp.company_id = cr.company_id
             WHERE jp.expiredate >= CURDATE() LIMIT ? OFFSET ?;`,
             [parseInt(limit), parseInt(offset)],
            (error, results, fields) => {
                if (error) {
                    return callBack(error);
                } 
                return callBack(null, results);
            }
        );
    },
    getTotalJobposting: (callBack)=>{
        pool.query(
            `select count(*) as totaljobpostings from job_posting`,(error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    applyForJob: (data, callBack) => {
        pool.query(
            `insert into job_applications (user_id,job_id,application_date,job_status) values (?,?,?,'pending')`,
            [data.user_id, data.job_id, data.application_date],
            (error, results, fields) => {
                if(error){
                    return callBack(error);
                }
                return callBack(null,results);
            }
        );
    },
    getApplications: (limit, offset, callBack) =>{
        pool.query(
            `select 
            job_applications.job_applicationID,
            job_applications.application_date,
            user_register.name,
            user_register.email_id,
            company_register.company_name,
            job_posting.jobtitle
            from job_applications 
            join user_register on job_applications.user_id = user_register.user_registerid 
            join job_posting on job_applications.job_id = job_posting.jobposting_id 
            join company_register on job_posting.company_id = company_register.company_id LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)],
            (error,results,fields) =>{
                if(error){
                    return callBack(error);
                }
                return callBack(null,results);
            }
        )
    },
    getTotalApplicationsCount: (callBack)=>{
        pool.query(
            `select count(*) as totalapplications from job_applications`,(error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    getActiveJobsByCompany:(company_id, limit, offset, callBack)=>{    
        pool.query(
            `select job_posting.*, company_register.email_id from job_posting join company_register on job_posting.company_id = company_register.company_id where job_posting.expiredate>= CURDATE() and job_posting.company_id = ? LIMIT ? OFFSET ?;`,
            [company_id, parseInt(limit), parseInt(offset)],
            (error, results, fields)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    getTotalActiveJobsByCompany: (company_id,callBack)=>{
        pool.query(
            `SELECT COUNT(*) AS totalactivejobs 
            FROM job_posting 
            WHERE expiredate >= CURDATE() 
            AND company_id = ?`,
            [company_id],
            (error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    getApplicationsByCompany: (company_id, limit, offset, callBack)=>{
        pool.query(
            `select
             job_applications.job_applicationID,
             job_applications.application_date,
             job_applications.job_status,
             job_posting.jobtitle,
             user_register.name,
             user_register.email_id,
             user_register.resume_path  
             from job_applications 
             join job_posting on job_applications.job_id = job_posting.jobposting_id
             join user_register on job_applications.user_id = user_register.user_registerid where job_posting.company_id = ? LIMIT ? OFFSET ?`,
             [company_id, limit, offset],
             (error,results,fields) => {
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
             }
        )
    },
    getTotalApplicationByCompany: (company_id, callBack)=>{
        pool.query(
            `SELECT COUNT(*) AS totalapplicationbycompany FROM job_applications JOIN job_posting ON job_applications.job_id = job_posting.jobposting_id WHERE job_posting.company_id = ?`,
            [company_id],
            (error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    getApplicationsByUser: (user_id, limit, offset, callBack)=> {
        pool.query(
            `select 
                job_applications.job_applicationID,
                job_applications.application_date,
                job_applications.job_status,
                job_posting.jobtitle,
                job_posting.companyname,
                job_posting.job_location 
            from job_applications
            join job_posting on job_applications.job_id = job_posting.jobposting_id
            where job_applications.user_id = ? LIMIT ? OFFSET ?`,
            [user_id, limit,offset],
            (error, results, fields)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    getTotalApplicationsByUser: (user_id, callBack)=>{
        pool.query(
            `select count(*) as totalapplicationsbyuser from job_applications where user_id = ?`,
            [user_id],
            (error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    deleteJobPostingByAdmin: (jobposting_id, callBack) => {
        pool.query(
            `SELECT jobsubcategory_id FROM job_posting WHERE jobposting_id = ?`,
            [jobposting_id],
            (error, results) => {
                if (error) {
                    return callBack(error);
                }
                if (results.length === 0) {
                    return callBack(null, { message: "Job posting not found" });
                }
    
                const jobsubcategory_id = results[0].jobsubcategory_id;
    
                // First, delete the job posting
                pool.query(
                    `DELETE FROM job_posting WHERE jobposting_id = ?`,
                    [jobposting_id],
                    (error, jobResults) => {
                        if (error) {
                            return callBack(error);
                        }
                        pool.query(
                            `SELECT COUNT(*) AS count FROM job_posting WHERE jobsubcategory_id = ?`,
                            [jobsubcategory_id],
                            (error, subcategoryCheckResults) => {
                                if (error) {
                                    return callBack(error);
                                }
    
                                const count = subcategoryCheckResults[0].count;
    
                                if (count === 0) {
                                    pool.query(
                                        `DELETE FROM job_subcategory WHERE jobsubcategory_id = ?`,
                                        [jobsubcategory_id],
                                        (error, subcategoryResults) => {
                                            if (error) {
                                                return callBack(error);
                                            }
                                            return callBack(null, { jobResults, subcategoryResults });
                                        }
                                    );
                                } else {
                                    return callBack(null, { jobResults, message: "Job posting deleted, but subcategory still in use" });
                                }
                            }
                        );
                    }
                );
            }
        );
    },
    deleteJobPostingByCompany: (jobposting_id, callBack) => {
        console.log("Deleting job with ID:", jobposting_id);

        pool.query(
            `DELETE FROM job_posting WHERE jobposting_id = ?`,
            [jobposting_id],
            (error, results) => {
                if (error) {
                    console.error("Error deleting from job_posting:", error); 
                    return callBack(error);
                }
                pool.query(
                    `DELETE FROM job_subcategory WHERE jobsubcategory_id NOT IN (SELECT jobsubcategory_id FROM job_posting)`,
                    [],
                    (err, subcategoryResults) => {
                        if (err) {
                            console.error("Error deleting from job_subcategory:", err);
                            return callBack(err);
                        }
                        console.log("Job and related subcategory deleted successfully.");
                        return callBack(null, results);
                    }
                );
            }
        );
    },    
    deleteRejectedJobs: (callBack) => {
        pool.query(
            `DELETE FROM job_posting WHERE jobposting_status = 'rejected' AND DATEDIFF(NOW(), updated_at) > 7`,
            (error, results) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    deleteJobApplicationByCompany: (job_applicationID, callBack) => {
        pool.query(
            `DELETE FROM job_applications WHERE job_applicationID = ?`,
            [job_applicationID],
            (error, results) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    deleteApplicationByUser:(job_applicationID, user_id, callBack)=>{
        pool.query(
            `delete from job_applications where job_applicationID = ? and user_id = ?`,
            [job_applicationID, user_id],
            (error,results)=>{
                if (error){
                    return callBack(error);
                }
                return callBack(null,error,results);
            }
        );
    },
    deleteRejectedApplications: (days, callBack)=>{
        pool.query(
            `delete from job_applications where job_status = 'Rejected' and TIMESTAMPDIFF(DAY, updated_at, NOW()) >= ? `,
            [days],
            (error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    // Apply for job button into applied status in Job posting
    checkJobStatus : (user_id, callBack)=> {
        pool.query(
            `select * from job_applications where user_id=?`,
            [user_id],
            (error, results, fields)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
            
        )
    },
    // update user applications from company side
    updateJobApplicationStatus: (data, callBack)=>{
        pool.query(
            `update job_applications set job_status = ? where job_applicationID = ?`,
            [data.job_status, data.job_applicationID],
            (error, results, fields)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
   
    // to create accept/reject post job applications.getApplications for admin
    registerUser: (data, callBack) => {
        pool.query(
            `insert into user_register(name,email_id,phone_no,password,location,user_profile,resume_path) values 
            (?,?,?,?,?,?,?)`,
             [data.name,data.email_id,data.phone_no,data.password,data.location,data.user_profile,data.resume_path],
            (error,results,fields) => {
                if (error) {
                   return callBack(error);
                }
                return callBack(null,results);
            }
        );
    },
    loginUser: (data,callBack) => {
        pool.query(
            `select * from user_register where email_id= ?`,[data.email_id],(error,results)=>{
            if (error){
                return callBack(error);
            }
            return callBack(null,results);
        });
    },
    verifyToken: (token, callBack) => {
        if(!token){
            return callBack('unauthorized',null);
        }
        jwt.verify(token,process.env.JWT_SECRET,(err, decoded) => {
            if (err){
                return callBack('Invalid Token',null);
            }
            callBack(null,decoded);
        });
    },
    updateUserProfileQuery: (data, callBack)=>{
        pool.query(
            `update user_register set name = ?, email_id = ?, phone_no =? , location =?, user_Profile = COALESCE(?, user_profile),  resume_path = COALESCE(?, resume_path) where user_registerid = ?`,
            [data.name,data.email_id,data.phone_no,data.location,data.user_Profile,data.resume_path,data.user_registerid],
            (error, results, fields)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        );
    },
    // Company Register 
    registerCompany: (data,callBack)=> {
        pool.query(
            `insert into company_register(company_name,email_id,phone_no,password,company_location,company_description,company_website,company_logo) values (?,?,?,?,?,?,?,?)`,
            [data.company_name, data.email_id, data.phone_no, data.password, data.company_location, data.company_description,data.company_website, data.company_logo],
            (error, results, fields) => {
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    loginCompany: (data,callBack) => {
        pool.query(
            `select * from company_register where email_id = ?`,
            [data.email_id],
            (error,results,fields) =>{
                if(error){
                    return callBack(error);
                }
                return callBack(null,results[0]);
            }
        );
    },
    verifyCompanyToken:(provider_authToken, callBack)=>{
        if(!provider_authToken){
            return callBack('unauthorized',null);
        }
        jwt.verify(provider_authToken,process.env.JWT_SECRET,(err, companyDecoded) => {
            if (err){
                return callBack('Invalid Token',null);
            }
            callBack(null,companyDecoded);
        })
    },
    
    registerAdmin: (data,callBack)=> {
        pool.query(
            `insert into jobportal_admin(admin_email,admin_password) values (?,?)`,
            [data.admin_email, data.admin_password],
            (error,results,fields)=>{
                if(error){
                    return callBack(error);
                }
                 return callBack(null, results);
            }
        );
    },
    loginAdmin: (data,callBack)=>{
        pool.query(
            `select * from jobportal_admin where admin_email = ?`,
            [data.admin_email],
            (error,results,fields)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null,results[0]);
            }
        );
    },
    verifyAdminToken:(admin_token, callBack)=>{
        if(!admin_token){
            return callBack('unauthorized',null);
        }
        jwt.verify(admin_token,process.env.JWT_SECRET,(err, adminDecoded) => {
            if (err){
                return callBack('Invalid Token',null);
            }
            callBack(null,adminDecoded);
        });
    },
    getAllUsers: (limit, offset, callBack)=>{
        pool.query(
            `select * from user_register LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)],
            ( error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    getTotalUsersCount: (callBack)=>{
        pool.query(
            `select count(*) as totalusers from user_register`,(error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    deleteUserByAdmin:(user_registerid, callBack)=>{
        pool.query(
            `delete from user_register where user_registerid = ?`,
            [user_registerid],
            (error,results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    getAllCompanies:(limit, offset, callBack)=>{
        pool.query(
            `select * from company_register LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)],
            ( error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    getTotalCompaniesCount:(callBack)=>{
        pool.query(
            `select count(*) as totalcompanies from company_register`,(error,results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    deleteCompaniesByAdmin:(company_id, callBack)=>{
        pool.query(
            `delete from company_register where company_id = ?`,
            [company_id],
            (error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    searchJobs: (data, callBack)=>{
        let query = `select * from job_posting where 1=1 `;
        const queryParams = [];
        if (data.jobtitle) {
            query += ` AND LOWER(jobtitle) LIKE LOWER(?)`;
            queryParams.push(`%${data.jobtitle}%`);
        }
    
        if (data.experience) {
            const exp = data.experience.trim().toLowerCase();
    
            if (exp === 'fresher') {
                // Match case-insensitive "Fresher"
                query += ` AND LOWER(experience) = 'fresher'`;
            } else if (!isNaN(parseInt(exp, 10))) {
                // Numeric experience with range handling
                query += ` AND (
                    experience = ?
                    OR experience LIKE ?
                )`;
                queryParams.push(parseInt(exp, 10), `${exp}-%`);
            }
        }
        // if (data.experience) {
        //     if (data.experience.toLowerCase() === 'fresher') {
        //         query += ` AND LOWER(experience) = 'fresher'`;
        //     } else {
        //         query += ` AND experience = ?`;
        //         queryParams.push(parseInt(data.experience, 10));;
        //     }
        // }
    
        if (data.job_location) {
            query += ` AND LOWER(job_location) LIKE LOWER(?)`;
            queryParams.push(`%${data.job_location.trim()}%`);
        }
        console.log('Executing query:', query, 'with params:', queryParams);

        pool.query(query, queryParams,(error,results)=>{
            if(error){
                return callBack(error);
            }
            if (results.length === 0) {
                // console.log("No matching records found.");
            }
            return callBack(null, results);
        });
    },
    getSearchSuggestions: (searchTerm, callback) => {
        const query = `
          SELECT DISTINCT jobtitle,job_location  
          FROM job_posting 
          WHERE jobtitle LIKE ?
           OR companyname LIKE ? 
           OR job_location LIKE ? 
           OR experience LIKE ? 
          LIMIT 10
        `;
        pool.query(
          query,
          [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
          (error, results) => {
            if (error) {
              return callback(error);
            }
            callback(null, results);
          }
        );
    },
    filterJobs: (data, callBack)=>{
        let filterQuery = 'select * from job_posting where 1=1';
        let filterValues = [];

        if(data.jobtitle){
            filterQuery += ' AND LOWER(jobtitle) LIKE LOWER (?)';
            filterValues.push('%' + data.jobtitle + '%');
        }
        if (data.employeetype && data.employeetype.length > 0) {
            const jobTypeCondition = data.employeetype
                .map(() => `LOWER(JSON_UNQUOTE(employeetype)) LIKE LOWER(?)`)
                .join(' OR ');
    
            filterQuery += ` AND (${jobTypeCondition})`;
            filterValues.push(...data.employeetype.map(type => `%${type}%`));
        }
        
        if(data.job_location){
            filterQuery += ' AND LOWER(job_location) LIKE LOWER (?)';
            filterValues.push('%' + data.job_location + '%');
        }
        if (data.experience && data.experience.length > 0) {
            const experienceConditions = data.experience.map(() => `experience LIKE ?`).join(' OR ');
            filterQuery += ` AND (${experienceConditions})`;
            filterValues.push(...data.experience.map(exp => `%${exp}%`));
        }
        const filterLimit = data.limit || 10;
        const filterOffset = data.offset || 0;   

        filterQuery += ' LIMIT ? OFFSET ?';
        filterValues.push(filterLimit, filterOffset);
        
        console.log('Final Query:', filterQuery);       
        console.log('Query Values:', filterValues); 

        pool.query(filterQuery, filterValues, (error, results) => {
            if (error) {
                return callBack(error);
            }
    
            // Query to get the total count of filtered results
            let countQuery = 'SELECT COUNT(*) AS totalCount FROM job_posting WHERE 1=1';
            let countValues = [];
    
            if (data.jobtitle) {
                countQuery += ' AND LOWER(jobtitle) LIKE LOWER (?)';
                countValues.push('%' + data.jobtitle + '%');
            }
            if (data.employeetype && data.employeetype.length > 0) {
                const jobTypeCondition = data.employeetype
                    .map(() => `LOWER(JSON_UNQUOTE(employeetype)) LIKE LOWER(?)`)
                    .join(' OR ');
    
                countQuery += ` AND (${jobTypeCondition})`;
                countValues.push(...data.employeetype.map(type => `%${type}%`));
            }
    
            if (data.job_location) {
                countQuery += ' AND LOWER(job_location) LIKE LOWER (?)';
                countValues.push('%' + data.job_location + '%');
            }
            if (data.experience && data.experience.length > 0) {
                const experienceConditions = data.experience.map(() => `experience LIKE ?`).join(' OR ');
                countQuery += ` AND (${experienceConditions})`;
                countValues.push(...data.experience.map(exp => `%${exp}%`));
            }
    
            pool.query(countQuery, countValues, (countError, countResults) => {
                if (countError) {
                    return callBack(countError);
                }
    
                const totalCount = countResults[0].totalCount; // Get the total count of results
                const totalPages = Math.ceil(totalCount / filterLimit); // Calculate total pages
    
                // Return filtered results along with total pages
                return callBack(null, { results, totalCount, totalPages });
            });
        });
    },
    // suggesstions for filter title and location
    suggestTitles: (input, callBack) => {
        const query = `
            SELECT DISTINCT jobtitle 
            FROM job_posting
            WHERE LOWER(jobtitle) LIKE LOWER(?)
            LIMIT 10`;    // Suggest max 10 titles
        pool.query(query, [`${input}%`], (error, results) => {
            if (error) {
                return callBack(error);
            }
            return callBack(null, results);
        });
    },

    // Suggest Job Locations
    suggestLocations: (input, callBack) => {
        const query = `
            SELECT DISTINCT job_location
            FROM job_posting
            WHERE LOWER(job_location) LIKE LOWER(?)
            LIMIT 10`;    // Suggest max 10 locations
        pool.query(query, [`${input}%`], (error, results) => {
            if (error) {
                return callBack(error);
            }
            return callBack(null, results);
        });
    },
    checkEmail: (email_id, callBack)=> {
        pool.query(
            `select * from user_register where email_id = ?`,
            [email_id],
            (error, results)=>{
                if (error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    userStoreOTP: (email_id, callBack)=>{
        const userOtp = userGeneratedOTP();
        const userOtpExpiresAt = Date.now()+ 60000;  // 1-minute validity
        userOtpStore.set(email_id, { userOtp, userOtpExpiresAt});

        return callBack(null, userOtp);
    },
    userVerifyOtp: (email_id, userOtp, callBack)=>{
        const userStoredOtpData = userOtpStore.get(email_id);
        if(!userStoredOtpData || userStoredOtpData.userOtp !== parseInt(userOtp) || Date.now() > userStoredOtpData.userOtpExpiresAt){
            return callBack('Invalid or expired OTP');
        }
        userOtpStore.delete(email_id);
        return callBack(null, 'OTP Verified');
    },
    userResetPassword: (email_id, userNewPassword, callBack)=>{
        bcrypt.hash(userNewPassword, 10, (err, hashedPassword)=>{
            if(err){
                return callBack(err);
            }
            pool.query(
                `update user_register set password = ? where email_id = ?`,
                [hashedPassword, email_id],
                (error, results)=>{
                    if(error){
                        return callBack(error);
                    }
                    return callBack(null, results);
                }
            )
        })
    },
    checkCompanyEmail: (email_id, callBack)=>{
        pool.query(
            `select * from company_register where email_id = ?`,
            [email_id],
            (error, results)=>{
                if(error){
                    return callBack(error);
                }
                return callBack(null, results);
            }
        )
    },
    companyStoreOtp:(email_id, callBack)=>{
        const companyOtp = companyGeneratedOTP();
        const companyOtpExpiresAt = Date.now()+ 60000;
        companyOtpStore.set(email_id, {companyOtp, companyOtpExpiresAt});

        return callBack(null, companyOtp);
    },
    companyVerifyOtp: (email_id, companyOtp, callBack)=>{
        const companyStoredOtpData = companyOtpStore.get(email_id);
        
        if(!companyStoredOtpData || companyStoredOtpData.companyOtp !== parseInt(companyOtp) || Date.now() > companyStoredOtpData.companyOtpExpiresAt){
            return callBack('Invalid or expired OTP');
        }
        companyOtpStore.delete(email_id);
        return callBack(null, 'OTP Verified');
    },
    companyResetPassword: (email_id, companyNewPassword, callBack)=>{
        bcrypt.hash(companyNewPassword, 10, (err, hashedPassword)=>{
            if(err){
                return callBack(err);
            }
            pool.query(
                `update company_register set password = ? where email_id = ?`,
                [hashedPassword, email_id],
                (error, results)=>{
                    if(error){
                        return callBack(error);
                    }
                    return callBack(null, results);
                }
            );
        });
    },

};
