const {addCategory, getCategory,addSubcategory,getSubcategory, addJobposting, getJobposting, registerUser, loginUser, verifyToken, getSubcategoriesByCategory,filterSubcategoriesService, getJobpostingBySubcategories, registerAdmin, loginAdmin, verifyAdminToken, registerCompany, loginCompany, verifyCompanyToken, applyForJob,filterJobs } = require('./jobposting.service');
const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const jobpostingService = require('./jobposting.service');
const path = require('path');
// const { json } = require('body-parser');
// require('dotenv').config();
const userTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const companyTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

module.exports={
    getCategory:(req,res) => {
        const limit = parseInt(req.query.limit) || 8;
        const offset = parseInt(req.query.offset) || 0;
        getCategory(limit, offset,(err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ success: false, message: 'Error retrieving categories' });
            }
            jobpostingService.getTotalCategories((err, countResult)=>{
                if (err) {
                    console.log(err);
                    return res.status(500).json({ success: false, message: 'Error retrieving total category count' });
                }
                return res.json({
                    success: true,
                    data: results,
                    totalCategories: countResult.total 
                });
            });
        });
    },
    addCategory:(req,res) => {
        const data = JSON.parse(req.body.data)
        // console.log(req.file)
        data.imageUrl=req.file.filename
        addCategory(data,(err, results) => {
            if (err){
                console.log(err);
                return res.json({
                    success: false,
                    message: 'Error occurred'
                });
            }
            return res.json({
                success:true,
                data: results
            });
        });
    },
    addSubcategory:(req,res) => {
        const data = JSON.parse(req.body.data)
        // console.log(req.file)
        data.imageUrl=req.file.filename
        addSubcategory(data,(err, results) => {
            if (err){
                console.log(err);
                return res.json({
                    success: false,
                    message: 'Error occurred'
                });
            }
            return res.json({
                success:true,
                data: results
            });
        });
    },
    getSubcategory: (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        getSubcategory(limit, offset, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ success: false, message: 'Error fetching subcategories' });
            }
            return res.json({
                success: true,
                data: results.data,
                totalCount: results.totalCount
            });
        });
    },
    getSubcategoriesByCategory: (req, res) => {
        const { id } = req.params;
        const limit = parseInt(req.query.limit, 10) || 10; 
        const offset = parseInt(req.query.offset, 10) || 0;

        getSubcategoriesByCategory(id, limit, offset, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, error: err.message });
            }
            return res.json({ success: true, data: results });
        });
    },
    updateJobStatusByAdmin: (req, res) => {
        const { jobposting_id, jobposting_status } = req.body;

        if (!jobposting_id || !jobposting_status) {
            return res.status(400).json({
                success: false,
                message: 'Job ID and Status are required',
            });
        }

        jobpostingService.updateJobStatusByAdmin(jobposting_id, jobposting_status, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: 'Error updating job status',
                });
            }
            return res.json({
                success: true,
                message: 'Job status updated successfully',
                data: results,
            });
        });
    },

    filterSubcategories: (req, res) => {
        const { categoryId, jobtitle, job_location, employeetype, experience } = req.body;
        const employeeTypeArray = Array.isArray(employeetype) ? employeetype : [];
        const experienceArray = Array.isArray(experience) ? experience : [];
        // console.log("Recedived filter request", req.body);

        filterSubcategoriesService(categoryId, jobtitle, job_location, employeeTypeArray, experienceArray, (err, results) => {
            if (err) {
                console.log('Database error:',err);
                return res.status(500).json({ success: false, message: 'Error occurred while fetching filtered subcategories' });
            }
            return res.json({ success: true, data: results });
        });
    },
    getJobpostingBySubcategories: (req, res) => {
        const {id} = req.params;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = parseInt(req.query.offset, 10) || 0;
        getJobpostingBySubcategories(id,limit,offset,(err,results) => {
            if (err){
                console.error(err);
                return res.status(500).json({success:false, error:err.message});
            }
            return res.json({success: true, data: results});
        })
    },
    addJobposting:(req,res) => {
        const data = req.body;

        addJobposting(data,(err,results) => {
            if(err){
                console.log(err);
                return res.json({
                    success: false,
                    message: 'Error Occured'
                });
            }
            return res.json({
                success:true,
                data: results
            });
        });
    },
    getJobposting:(req,res) => {
        let limit = parseInt(req.query.limit) || 10;
        let page = parseInt(req.query.page) || 1;
        let offset = (page-1)*limit;
        getJobposting(limit, offset,(err,results) => {
            if(err) {
                console.log(err);
                return res.status(500).json({success: false, message: 'Database error'});
            }
            jobpostingService.getTotalJobposting((countErr, totaljobpostings)=>{
                if(countErr){
                    return res.status(500).json({success: false, message:'Error fetching total users'});
                }
                return res.json({
                    success: true,
                    data: results,
                    totalJobpostings: totaljobpostings[0].totaljobpostings,
                    totalPages: Math.ceil(totaljobpostings[0].totaljobpostings/limit),
                    currentPage: page
                });
            });
        });
    },
    getApplications: (req,res)=> {
        let limit = parseInt(req.query.limit) || 10;
        let page = parseInt(req.query.page) || 1;
        let offset = (page-1) * limit;
        jobpostingService.getApplications(limit, offset, (err, results) => {
            if (err) {
                console.error("Error fetching job applications:", err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                });
            }
            jobpostingService.getTotalApplicationsCount((countErr, totalapplications)=>{
                if (countErr) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error occurred while fetching total applications count'
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: results,
                    totalApplications : totalapplications,
                    totalPages: Math.ceil(totalapplications[0].totalapplications / limit),
                    currentPage: page
                });
            });
        });
    },
    getActiveJobsByCompany:(req,res)=>{
        const company_id = req.params.company_id;
        let limit = parseInt(req.query.limit) || 10;
        let page = parseInt(req.query.page) || 1;
        let offset = (page-1) * limit;
        jobpostingService.getActiveJobsByCompany(company_id, limit,offset, (err, results)=>{
            if(err){
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }
            jobpostingService.getTotalActiveJobsByCompany(company_id, (countErr, totalactivejobs)=>{
                if (countErr) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error occurred while fetching total applications count'
                    });
                }
                return res.json({
                    success: true,
                    data: results,
                    totalActiveJobs : totalactivejobs[0].totalactivejobs,
                    totalPages: Math.ceil(totalactivejobs[0].totalactivejobs / limit),
                    currentPage: page
                });
            });
        });
    },
    getApplicationsByCompany: (req, res) => {
        const { company_id, limit = 10, page = 1 } = req.body; 
        let offset = (page - 1) * limit;
        // console.log("company id: " , company_id);
        jobpostingService.getApplicationsByCompany(company_id, limit, offset,(err, results)=>{
            if(err){
                console.error("Error fetching company applications:", err);
                return res.status(500).json(
                    {
                        success: false,
                        message: " Error fetching company results"
                    });
            }
            jobpostingService.getTotalApplicationByCompany(company_id, (countErr, totalapplicationbycompany)=>{
                if (countErr) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error occurred while fetching total applications count'
                    });
                }
                return res.json({
                    success: true,
                    data: results,
                    totalApplicationsByCompany : totalapplicationbycompany[0].totalapplicationbycompany,
                    totalPages: Math.ceil(totalapplicationbycompany[0].totalapplicationbycompany / limit),
                    currentPage: page
                });
            })
        })
    },
    getApplicationsByUser: (req,res)=>{
        const {user_id, limit = 10, page = 1} = req.body;
        let offset = (page-1) * limit;
        // console.log("Request body:", req.body);
        jobpostingService.getApplicationsByUser(user_id,limit, offset, (err, results)=>{
            if(err){
                console.error("Error fetching user applications:", err);
                return res.status(500).json(
                    {
                        success: false,
                        message: " Error fetching user results"
                    }
                );
            }
            jobpostingService.getTotalApplicationsByUser(user_id,(countErr, totalapplicationsbyuser)=>{
                if (countErr) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error occurred while fetching total applications count'
                    });
                }
                return res.json({
                    success: true,
                    data: results,
                    totalApplicationsByUser : totalapplicationsbyuser[0].totalapplicationsbyuser,
                    totalPages: Math.ceil(totalapplicationsbyuser[0].totalapplicationsbyuser / limit),
                    currentPage: page
                });
            });
        });
    },
    deleteJobPostingByAdmin: (req, res) => {
        const jobposting_id = req.params.jobposting_id;

        jobpostingService.deleteJobPostingByAdmin(jobposting_id, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Error deleting job posting",
                });
            }

            return res.json({
                success: true,
                message: "Job posting deleted successfully",
            });
        });
    },
    deleteJobPostingByCompany: (req, res) => {
        const jobposting_id = req.params.jobposting_id;
        jobpostingService.deleteJobPostingByCompany(jobposting_id, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ 
                    success: false, 
                    message: "Failed to delete job posting",
                    error: err 
                });
            }
            return res.json({ success: true, message: "Job posting deleted successfully" });
        });
    },
    deleteRejectedJobs: (req, res) => {
        jobpostingService.deleteRejectedJobs((err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ success: false, message: "Error deleting old rejected jobs" });
            }
            return res.json({ success: true, message: "Old rejected jobs deleted successfully" });
        });
    },
    deleteJobApplicationByCompany: (req, res) => {
        const job_applicationID = req.params.job_applicationID;

        jobpostingService.deleteJobApplicationByCompany(job_applicationID, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: 'Error deleting job application'
                });
            }

            return res.json({
                success: true,
                message: 'Job application deleted successfully'
            });
        });
    },
    deleteApplicationByUser: (req, res)=>{
        const {job_applicationID, user_id} = req.query;

        if(!job_applicationID || !user_id){
            return res.status(400).json({
                success:false,
                message: 'Application ID and User ID required'
            })
        }
        jobpostingService.deleteApplicationByUser(job_applicationID,user_id,(err, results)=>{
            if(err){
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: 'Error deleting job application'
                });
            }
            return res.json({
                success: true,
                message: 'Job Application deleted successfully'
            });
        });
    },
    // deleteRejectedApplications: (req, res) => {
    //     const days = parseInt(req.query.days) || 7; // Default to 7 days

    //     djobpostingService.eleteRejectedApplications(days, (err, results) => {
    //         if (err) {
    //             console.error(err);
    //             return res.status(500).json({
    //                 success: false,
    //                 message: 'Error deleting rejected job applications'
    //             });
    //         }
    //         return res.json({
    //             success: true,
    //             message: `Deleted ${results.affectedRows} rejected job applications.`,
    //             affectedRows: results.affectedRows
    //         });
    //     });
    // },
    applyForJob: (req,res)=>{
        const {user_id, job_id}  =req.body;
        if(!user_id || !job_id){
            return res.status(400).json({
                success: false,
                message: 'user_id and job_id are required'
            });
        }
        const application_date = new Date()
        .toISOString()
        .slice(0,19)
        .replace('T', ' ');
        applyForJob({ user_id, job_id, application_date },(err, results) =>{
            if(err){
                return res.status(500).json({
                    success: false,
                    message: 'Error occurred while adding job application',
                    error: err
                });
            }
            return res.json({
                success: true,
                message: 'Job application successfully added',
                error: err
            });
        });
    },
    checkJobStatus:(req, res)=>{
        const {user_id} = req.params;
        jobpostingService.checkJobStatus(user_id, (err, results)=>{
            if(err){
                return res.status(500).json({ success: false, message: 'Error checking application status' });
            }
            const appliedJobsId = results.map(job=>job.job_id);
            return res.status(200).json({
                success : true,
                appliedJobs: appliedJobsId
            });
        });
    },
    updateJobApplicationStatus:(req, res)=>{
        const {job_applicationID, job_status}= req.body;

        const validStatuses = ['Applied','Under Review','Accepted','Rejected']

        if(!validStatuses.includes(job_status)){
            return res.status(400).json({success: false, message: "Invalid status"});
        }
        const statusData = {job_applicationID,job_status};
        jobpostingService.updateJobApplicationStatus(statusData,(err, results)=>{
            if(err){
                return res.status(500).json({success: false, message: "Error updating status"});
            }
            return res.status(200).json({success: true, message: "Application updated successfully"});
        });
    },
    registerUser: async (req, res) => {
        const { jobseekerName, jobseekerEmail_id, jobseekerPhone_no, jobseekerPassword, jobseekerLocation } = req.body;

        const jobseekerProfile = req.files['jobseekerProfile'] ? req.files['jobseekerProfile'][0].filename : null;
        const resume_path = req.files['resume_path'] ? req.files['resume_path'][0].filename : null;

        console.log("Received Profile Image:", jobseekerProfile);
        console.log("Received Resume File:", resume_path);

      
        // const resume_path = req.file.filename;

        if (!jobseekerName || !jobseekerEmail_id || !jobseekerPhone_no || !jobseekerPassword || !jobseekerLocation || !resume_path) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        pool.query('SELECT email_id FROM user_register WHERE email_id = ?', [jobseekerEmail_id], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Database error occurred' });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: 'Email id already taken' });
            }
            const hashedPassword = await bcrypt.hash(jobseekerPassword, 8);
            const userData = {
                name:jobseekerName,
                email_id:jobseekerEmail_id,
                phone_no:jobseekerPhone_no,
                password:hashedPassword,
                location:jobseekerLocation,
                user_profile: jobseekerProfile,
                resume_path: resume_path
            };
            registerUser(userData, (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error registering user' });
                }
                return res.status(200).json({ message: 'User registered successfully',data:results });
            });
        });
    },
    loginUser: async (req, res) => {
        const { loginEmail_id, login_Password } = req.body;
        if (!loginEmail_id || !login_Password) {
            return res.status(200).json({success: false,
                message: 'Email and Password are required' });
        }
        pool.query('SELECT * FROM user_register WHERE email_id = ?', [loginEmail_id], async(err, results) => {
            
            if (err) {
                console.log(err);
                return res.status(500).json({success: false,
                    message: 'Database error occurred' });
            }
            if (results.length === 0) {
                return res.status(200).json({success: false,
                    message: 'Invalid email or password' });
            }
            const user = results[0];
            // console.log(user);
            const isPasswordMatch = await bcrypt.compare(login_Password, user.password);
            if(!isPasswordMatch){
                return res.status(200).json({success: false,
                    message:'Invalid email or password'})
            }     
            const user_registerid =results[0].user_registerid;
            const token =jwt.sign({
                user_registerid : user.user_registerid,
                name:user.name, 
                email_id: user.email_id,
                phone_no: user.phone_no,   
                location: user.location, 
                user_profile: user.user_profile,
                resume_path: user.resume_path 
            },
            process.env.JWT_SECRET,{
                expiresIn: process.env.JWT_EXPIRES_IN
            });  
            // console.log('the token is ' + token);
            const cookieOptions = {
                expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                ),
                secure: true,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none'
            }
            res.cookie('auth_token', token, cookieOptions);
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                user: { user_registerid: user.user_registerid, name: user.name, email_id: user.email_id }
            });
        });   
    },
    getCurrentUser: (req,res) => {
        const decode = req.cookies.auth_token;
        verifyToken(decode,(err, decoded) => {
            if(err){
                return res.status(401).json({ message : err});
            }
            res.status(200).json({
                user: { user_registerid: decoded.user_registerid, name: decoded.name, email_id: decoded.email_id,phone_no: decoded.phone_no, location: decoded.location, user_profile: decoded.user_profile, resume_path: decoded.resume_path }
            });
        });
    },
    updateUserProfile: async(req,res)=>{
        const user_registerid = req.params.id;
        const { name, email_id, phone_no, location, existingProfile, existingResume } = req.body;
        
        const resumeFileName = existingResume ? existingResume.split('/').pop() : null;

        const jobseekerProfile = req.files['jobseekerProfile']
        ? req.files['jobseekerProfile'][0].filename
        : existingProfile || 'default.jpg';

        const resume_path = req.files['resume_path']
        ? req.files['resume_path'][0].filename
        : resumeFileName;

        if (!name || !email_id || !phone_no || !location) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const userData = {
            user_registerid,
            name,
            email_id,
            phone_no,
            location,
            user_Profile: jobseekerProfile,
            resume_path: resume_path 
        };
        jobpostingService.updateUserProfileQuery(userData, (err, results)=>{
            if(err){
                console.error(err);
                return res.status(500).json({ message: 'Error updating user profile' });
            }
            pool.query(`SELECT * FROM user_register WHERE user_registerid = ?`, [user_registerid], (error, updatedUser) => {
                if (error) {
                    console.error('Error fetching updated user:', error);
                    return res.status(500).json({ message: 'Error retrieving updated user data' });
                }
                console.log('Updated User:', updatedUser[0]); 
                return res.status(200).json({
                    message: 'User profile updated successfully',
                    user: updatedUser[0]
                });
            });
        });
    },
    logoutUser: (req, res) => {
        res.clearCookie("auth_token",{
            expires: new Date(Date.now() + 2 * 1000),
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict'
        });
        return res.status(200).json({
            success: true,
            message: 'User Logout Successful'
        });
    },
    registerCompany: async (req, res) => {
        const {jobproviderName, jobproviderEmail_id, jobproviderPhone_no, jobproviderPassword, jobproviderLocation, jobproviderDescription, jobproviderWebsite} = req.body;
        const jobproviderLogo = req.file ? req.file.filename : null;
       
        if(!jobproviderName || !jobproviderEmail_id || !jobproviderPhone_no || !jobproviderPassword || !jobproviderLocation || !jobproviderDescription || !jobproviderWebsite || !jobproviderLogo) {
            return res.status(400).json({ message: 'All fields are required'});
        }
        pool.query('select email_id from company_register where email_id = ?' , [jobproviderEmail_id], async (err, results)=> {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Database error occured'});
            }
            if(results.length>0){
                return res.status(400).json({ message: 'Email id already taken'});
            }
            const providerHashedPassword = await bcrypt.hash(jobproviderPassword, 8);
            const fileName = jobproviderLogo || null; 
            console.log('File Name after Basename:', fileName);

            const providerData = {
                company_name: jobproviderName,
                email_id: jobproviderEmail_id,
                phone_no: jobproviderPhone_no,
                password: providerHashedPassword,
                company_location: jobproviderLocation,
                company_description: jobproviderDescription,
                company_website: jobproviderWebsite,
                company_logo: fileName,
            };
            registerCompany(providerData, (err, results) => {
                if(err){
                    console.log(err);
                    return res.status(500).json({ message: 'Error registering company'});
                }
                return res.status(200).json({ message: 'Company registered successfully', data:results});
            });
        });
    },
    loginCompany: async (req,res) => {
        const {loginEmail_id, login_Password} = req.body;
        if(!loginEmail_id || !login_Password){
            return res.status(200).json({ success: false, message: "Email and password are required"});
        }
        pool.query('select * from company_register where email_id = ?', [loginEmail_id], async(err,results)=> {
            if(err){
                console.log(err);
                return res.status(500).json({success: false,
                    message: 'Database error occurred' });
            }
            if (results.length === 0) {
                return res.status(200).json({success: false,
                    message: 'Invalid email or password' });
            }
            const company = results[0];
            // console.log(company);
            const isPasswordMatchProvider = await bcrypt.compare(login_Password, company.password);
            if(!isPasswordMatchProvider){
                return res.status(200).json({success: false,
                    message:'Invalid email or password'})
            }
            const company_id = results[0].company_id;
            const companyToken = jwt.sign({
                company_id : company_id, 
                company_name : company.company_name, 
                email_id : company.email_id,
                company_description: company.company_description,
                company_website: company.company_website,
                phone_no: company.phone_no,
                company_logo: company.company_logo  
            },
                process.env.JWT_SECRET,{
                expiresIn: process.env.JWT_EXPIRES_IN
            });
            const companyCookieOptions = {
                expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES *24 * 60 * 60 * 1000
                ),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            }
            res.cookie('provider_authToken', companyToken, companyCookieOptions);
            return res.status(200).json({
                success: true,
                message: 'Company Login Successful',
                company: { company_id : company.company_id, company_name: company.company_name, company_email: company.email_id}
            });
        });
    },
    getCurrentCompany: (req,res)=> {
        const companyDecode = req.cookies.provider_authToken;
        verifyCompanyToken(companyDecode,(err, companyDecoded)=>{
            if(err){
                return res.status(401).json({message: err});
            }
            // console.log('Decoded Token:', companyDecoded);
            res.status(200).json({
                company: {company_id: companyDecoded.company_id, company_name: companyDecoded.company_name, email_id: companyDecoded.email_id, company_description: companyDecoded.company_description, company_website: companyDecoded.company_website, phone_no: companyDecoded.phone_no, company_logo: companyDecoded.company_logo}
            });
        });
    },
    
    logoutCompany: (req,res) => {
        res.clearCookie("provider_authToken", {
            expires: new Date(Date.now()+2*1000),
            httpOnly: true,
        });
        return res.status(200).json({success: true, message: 'Company Logout successful' });
    },
    registerAdmin: async (req,res)=>{
        const { admin_email, admin_password } = req.body;
        console.log("Received body fields:", {admin_email,admin_password});
        if (!admin_email || !admin_password) {
          return res.status(400).json({ message: 'All fields are required' });
        }
        pool.query('select admin_email from jobportal_admin where admin_email=?',[admin_email], async (err,results)=>{
            if(err){
                console.log(err);
                return res.status(500).json({message:'Database error occured'});
            }
            if(results.length>0){
                return res.status(400).json({message:'Email id already taken'});
            }
            const adminHashedPassword = await bcrypt.hash(admin_password,8);
            const adminData={
                admin_email: admin_email,
                admin_password: adminHashedPassword
            };
            registerAdmin(adminData, (err,results)=>{
                if(err){
                    console.log(err);
                    return res.status(500).json({message: 'Error registering admin'});
                }
                return res.status(200).json({message: 'Admin registered successfully',data:results});

            });

            });
        },
        loginAdmin: async(req,res)=>{
            const {admin_email, admin_password}=req.body;
            if (!admin_email || !admin_password) {
                return res.status(400).json({success:false, message: 'Please provide email and password' });
              }
              pool.query('select * from jobportal_admin where admin_email=?', [admin_email], async(err,results)=>{
                if (err){
                    console.log(err);
                    return res.status(500).json({success: false, message: 'Database error occured'});
                }
                if (results.length===0){
                    return res.status(200).json({success: false, message: 'Invalid email or password'});
                }
                const admin = results[0];
                // console.log(admin);
                const isAdminPasswordMatch = await bcrypt.compare(admin_password,admin.admin_password);
                if(!isAdminPasswordMatch){
                    return res.status(200).json({success: false, message: 'Invalid email or password'});
                }
                const admin_id= results[0].admin_id;
                const admin_token = jwt.sign({admin_id : admin_id,admin_email: admin.admin_email, admin_full_name: admin.admin_full_name, phone_number: admin.phone_number}, process.env.JWT_SECRET,{
                    expiresIn: process.env.JWT_EXPIRES_IN
                 });
                const adminCookieOptions = {
                    expires:new Date(Date.now()+ process.env.JWT_COOKIE_EXPIRES *24*60*60*1000),
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                }
                res.cookie('admin_authToken', admin_token, adminCookieOptions);
                return res.status(200).json({
                    success: true,
                    message: 'Admin Login Successful',
                    admin: { admin_id : admin.admin_id, admin_email: admin.admin_email}
                });
              });
            },
    getCurrentAdmin: (req,res)=> {
        const adminDecode = req.cookies.admin_authToken;
        // console.log(req.cookies);
        verifyAdminToken(adminDecode,(err, adminDecoded)=>{
            if(err){
                return res.status(401).json({message: err});
            }
            res.status(200).json({
                admin: {admin_id: adminDecoded.admin_id, admin_email: adminDecoded.admin_email, admin_full_name: adminDecoded.admin_full_name, phone_number: adminDecoded.phone_number }
            });
        })
    },
    logoutAdmin:(req,res) => {
        res.clearCookie("admin_authToken",{
            expires: new Date(Date.now()+2*1000),
            httpOnly: true,
        });
        return res.status(200).json({success: true, message: 'Admin Logout successful' });
    },
    getUsers:(req,res)=>{
        let limit = parseInt(req.query.limit) || 10;
        let page = parseInt(req.query.page) || 1;
        let offset = (page-1) * limit;
        jobpostingService.getAllUsers(limit, offset, (err, results)=>{
            if(err){
                console.log(err);
                return res.status(500).json({success: false, message: 'Database error'});
            }
            jobpostingService.getTotalUsersCount((countErr, totalusers)=>{
                if(countErr){
                    return res.status(500).json({success: false, message: 'Error fetching total users'});
                }
                return res.json({
                    success: true, 
                    data: results, 
                    totalUsers: totalusers[0].totalusers,
                    totalPages: Math.ceil(totalusers[0].totalusers / limit),
                    currentPage: page
                });
            });
        });
    },
    deleteUSerByAdmin: (req,res)=> {
        const user_registerid = req.params.user_registerid;
        jobpostingService.deleteUserByAdmin(user_registerid,(err, results)=>{
            if(err){
                console.log(err);
                return res.status(500).json({success: false, message: 'Database error'});
            }
            if (results.affectedRows === 0){
                return res.status(404).json({ success: false, message: "User not found" });
            }
            return res.json({ success: true, message: "User deleted successfully" });
        })
    },
    getcompanies:(req,res)=>{
        let limit = parseInt(req.query.limit) || 10;
        let page = parseInt(req.query.page) || 1;
        let offset = (page-1)*limit;
        jobpostingService.getAllCompanies(limit, offset,(err, results)=>{
            if(err){
                console.log(err);
                return res.status(500).json({success: false, message: 'Database error'});
            }
            jobpostingService.getTotalCompaniesCount((countErr, totalcompanies)=>{
                if(countErr){
                    return res.status(500).json({message: false, message: 'Error fetching total users'});
                }
                return res.json({
                    success: true, 
                    data: results, 
                    totalCompanies: totalcompanies[0].totalcompanies,
                    totalPages: Math.ceil(totalcompanies[0].totalcomapnies / limit),
                    currentPage: page
                });
            });
        });
    },
    deleteCompaniesByAdmin: (req, res)=>{
        const company_id = req.params.company_id;
        jobpostingService.deleteCompaniesByAdmin(company_id, (err, results)=>{
            if(err){
                console.log(err);
                return res.status(500).json({success: false, message: 'Database error'});
            }
            if (results.affectedRows === 0){
                return res.status(404).json({ success: false, message: "company not found" });
            }
            return res.json({ success: true, message: "company deleted successfully" });
        })
    },
     postJob :(req, res) => {
        const jobData = req.body;
        const category_imageUrl = req.files['category_imageUrl']?.[0]?.filename;
        const job_Logo = req.files['job_Logo']?.[0]?.filename;

        // Step 1: Check or Add Category
        jobpostingService.checkIsCategoryExist(jobData.categoryname, (err, categoryResult) => {
            if (err) {
                console.error("Error checking category:", err);
                return res.status(500).json({ success: false, message: "Error checking category" });
            }
    
            let category_id;
            let imageUrl = category_imageUrl || null;
            // console.log("cateimg:" ,imageUrl);
            if (categoryResult.length > 0) {
                category_id = categoryResult[0].jobcategory_id; // Use existing category_id
                imageUrl = categoryResult[0].imageUrl || imageUrl;
                addSubcategory();
            } else {
                jobpostingService.addCategory({ categoryname: jobData.categoryname, imageUrl }, (err, addCategoryResult) => {
                    if (err) {
                        console.error("Error adding category:", err);
                        return res.status(500).json({ success: false, message: "Error adding category" });
                    }
                    category_id = addCategoryResult.insertId; // Use newly inserted category_id
                    addSubcategory();
                });
            }
    
            // Step 2: Add Subcategory
            function addSubcategory() {
                const subcategoryData = {
                    jobcategory_id: category_id,
                    subcategoryid: jobData.subcategoryid || null,
                    imageUrl: job_Logo,
                    companyname: jobData.companyname,
                    job_location: jobData.job_location,
                    salary: jobData.salary,
                    date: jobData.date || new Date(),
                    jobtype: jobData.jobtype,
                    jobtitle: jobData.jobtitle,
                };
                console.log("Subcategory data: ", subcategoryData);
    
                jobpostingService.addSubcategory(subcategoryData, (err, subcategoryResult) => {
                    if (err) {
                        console.error("Error adding subcategory:", err);
                        return res.status(500).json({ success: false, message: "Error adding subcategory" });
                    }
    
                    const subcategory_id = subcategoryResult.insertId; // Use newly inserted subcategory_id
                    addJobPosting(subcategory_id);
                });
            }
    
            // Step 3: Add Job Posting
            function addJobPosting(subcategory_id) {
                const jobPostingData = {
                    jobsubcategory_id: subcategory_id,
                    company_id: jobData.company_id,
                    jobcategory_id: category_id,
                    dateposted: jobData.dateposted || new Date(),
                    expiredate: jobData.applicationDeadline || null,
                    companyname: jobData.companyname,
                    company_website : jobData.company_website,
                    vacancy_required : jobData.vacancy_required,
                    jobtitle: jobData.jobtitle,
                    imageUrl: job_Logo,
                    employeetype: JSON.stringify(jobData.employeetype),
                    qualifications: jobData.qualifications,
                    experience: jobData.experience,
                    salary: jobData.salary,
                    skillsrequired: jobData.skillsrequired,
                    jobdescription: jobData.jobdescription,
                    job_location: jobData.job_location,
                    keyresponse_1: jobData.keyresponse_1 || '',
                    keyresponse_2: jobData.keyresponse_2 || '',
                    skills_1: jobData.skills_1 || '',
                    skills_2: jobData.skills_2 || '',
                };
                console.log("Job Posting Data:", jobPostingData);
                jobpostingService.addJobposting(jobPostingData, (err, jobpostingResult) => {
                    if (err) {
                        console.error("Error adding job posting:", err);
                        return res.status(500).json({ success: false, message: "Error adding job posting" });
                    }
    
                    return res.status(200).json({ success: true, message: "Job posted successfully" });
                });
            }
        });
    },
    searchJobs: (req,res)=>{
        const { jobtitle, experience, job_location } = req.body;
        jobpostingService.searchJobs({ jobtitle, experience, job_location }, (err, results)=> {
            if(err){
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: 'Error occurred during job search'
                });
            }
            if (results.length === 0) {
                return res.json({
                    success: true,
                    message: 'No matching jobs found',
                    data: []
                });
            }
            return res.json({
                success: true,
                data: results
            });
        });
    },
    searchSuggestions: (req,res)=>{
        const searchTerm = req.query.q;

        if (!searchTerm) {
            return res.status(400).json({ success: false, message: 'Search term is required' });
          }
        //   console.log('Received Search Term:', searchTerm);
        jobpostingService.getSearchSuggestions(searchTerm, (err, results) => {
            if (err) {
              console.error("Database Error:", err);
              return res.status(500).json({ success: false, message: "Database query failed" });
            }
          
            // console.log("Database Results for Search:", results);
          
            return res.json({
              success: true,
              suggestions: results.map(result => result.jobtitle || "No Title Found")
            });
          });
        },
        filterJobs: (req, res)=>{
            const jobFilter = req.body;
            console.log('Received Filter:', jobFilter);  

            filterJobs(jobFilter, (err,results)=>{
                if(err){
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database query error'
                    });
                }
                if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No matching jobs found',
                    data: []
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Jobs filtered successfully',
                data: results.results,
                totalCount: results.totalCount, 
                totalPages: results.totalPages, 
            });
        });
    },
    getTitleSuggestions: (req, res) => {
        const { input } = req.query;  
        if (!input) {
            return res.status(400).json({
                success: false,
                message: 'No input provided'
            });
        }

        jobpostingService.suggestTitles(input, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: 'Database query error'
                });
            }
            return res.json({
                success: true,
                data: results
            });
        });
    },

    // Suggest Locations
    getLocationSuggestions: (req, res) => {
        const { input } = req.query;  // Use query parameters
        if (!input) {
            return res.status(400).json({
                success: false,
                message: 'No input provided'
            });
        }

        jobpostingService.suggestLocations(input, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: 'Database query error'
                });
            }
            return res.json({
                success: true,
                data: results
            });
        });
    },
    sendUserOtp: (req, res)=>{
        const {email_id}= req.body;
        jobpostingService.checkEmail(email_id, (err,results)=>{
            if(err || results.length === 0){
                return res.status(404).json({success: false, message: 'Email not registered'});
            }
            jobpostingService.userStoreOTP(email_id, (err, userOtp)=>{
                if(err) return res.status(500).json({success:false, message: 'Error generated OTP'});

                const userMailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email_id,
                    subject: 'Password Reset OTP',
                    text: `Your OTP for Password reset is: ${userOtp}. This OTP is valid for 1 minute.`
                };
                userTransporter.sendMail(userMailOptions,(error)=>{
                    if(error){
                        return res.status(500).json({success: false, message: 'Failed to send OTP'});
                    }
                    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
                });
            });
        });
    },
    userValidateOTP: (req, res)=>{
        const {email_id,userOtp}= req.body;

        jobpostingService.userVerifyOtp(email_id, userOtp, (err, result)=>{
            if(err){
                return res.status(400).json({ success: false, message: err });
            }
            return  res.status(200).json({ success: true, message: result });
        })
    },
    userUpdatePassword: (req, res)=>{
        const {email_id, userNewPassword}= req.body;

        jobpostingService.userResetPassword(email_id, userNewPassword, (err, results)=>{
            if(err){
                return res.status(500).json({ success: false, message: 'Failed to update password' });
            }
            return res.status(200).json({ success: true, message: 'Password reset successfully' });
        });
    },
    sendCompanyOtp: (req, res)=>{
        const {email_id} = req.body;
        jobpostingService.checkCompanyEmail(email_id, (err, results)=>{
            if(err || results.length === 0){
                return res.status(404).json({success: false, message: 'Email not registered'});
            }
            jobpostingService.companyStoreOtp(email_id, (err, companyOtp)=>{
                if(err) return res.status(500).json({success:false, message: 'Error generated OTP'});
                const companyMailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email_id,
                    subject: 'Password Reset OTP',
                    text: `Your OTP for Password reset is: ${companyOtp}. This OTP is valid for 1 minute.`
                };
                companyTransporter.sendMail(companyMailOptions, (error)=>{
                    if(error){
                        return res.status(500).json({success: false, message: 'Failed to send OTP'});
                    }
                    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
                });
            });
        });
    },
    companyValidateOTP: (req, res)=>{
        const {email_id, companyOtp}= req.body;
        jobpostingService.companyVerifyOtp(email_id, companyOtp, (err, result)=>{
            if(err){
                return res.status(400).json({ success: false, message: err });
            }
            return  res.status(200).json({ success: true, message: result });
        });
    },
    companyUpdatePassword: (req, res)=>{
        const {email_id, companyNewPassword}= req.body;
        jobpostingService.companyResetPassword(email_id, companyNewPassword, (err, results)=>{
            if(err){
                return res.status(500).json({ success: false, message: 'Failed to update password' });
            }
            return res.status(200).json({ success: true, message: 'Password reset successfully' });
        });
    }    
};
    
   
    
    
    
    