const express = require('express');
const router = express.Router();
const multer = require("multer");
const jwt = require('jsonwebtoken');
const path = require('path');
const {getCategory, addCategory, getJobposting, addJobposting, registerUser, loginUser, getCurrentUser, getSubcategoriesByCategory, getJobpostingBySubcategories, registerAdmin, logoutAdmin, logoutUser, loginAdmin, getCurrentAdmin, registerCompany, loginCompany, logoutCompany, getCurrentCompany, applyForJob, getApplications, postJob, getApplicationsByCompany, getApplicationsByUser, checkJobStatus, searchJobs, searchSuggestions, filterJobs, filterSubcategories, updateJobApplications, updateJobApplicationStatus, updateUserProfile, deleteApplicationByUser, deleteRejectedApplications, sendUserOtp, userValidateOTP, userUpdatePassword, sendCompanyOtp,  companyValidateOTP, companyUpdatePassword, getUsers, deleteUSerByAdmin, getcompanies, deleteCompaniesByAdmin, approveJobPost, getApprovedJobs, getActiveJobsByCompany, updateJobStatusByAdmin, deleteJobPostingByCompany, deleteRejectedJobs, deleteJobPostingByAdmin, deleteJobApplicationByCompany, getTitleSuggestions, getLocationSuggestions,   } = require("./jobposting.controller");
const {addSubcategory, getSubcategory} = require("./jobposting.controller")

const storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, 'uploads');
    },
    filename: (req, file, callBack) => {
        callBack(null, `categoryimage_${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// combine categoryImage and JobLogos
const upload_CategoryImage_jobLogo = multer.diskStorage({
    destination: (req, file, callBack)=>{
        if (file.fieldname=== 'category_imageUrl'){
            callBack(null, 'uploads/categoryImage');
        }else if (file.fieldname === 'job_Logo'){
            callBack(null, 'uploads/jobLogo');
        }else {
            callBack(new Error ('invalid field name'), null);
        }
    },
    filename : (req, file, callBack)=>{
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        callBack(null, `${file.fieldname}_${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload_CategoryImage_jobLogos = multer({storage : upload_CategoryImage_jobLogo});

const userProfileStorage = multer.diskStorage({
    destination: (req, file, callBack) =>{
        if(file.fieldname === "jobseekerProfile"){
            callBack(null, 'uploads/user_Profiles');
        }else if(file.fieldname === "resume_path") {
            callBack(null, 'uploads/resumes');
        }
    },
    filename: (req,file, callBack)=>{
        callBack(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
    }
});
const profileFileFilter = (req, file, callBack) => {
    const profileAllowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (profileAllowedTypes.includes(file.mimetype)) {
        callBack(null, true);
    } else {
        callBack(new Error('Only image files (jpeg, png, gif, webp) are allowed for profile picture'));
    }
};
const resumeFileFilter = (req, file, callBack) => {
    const resumeAllowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (resumeAllowedTypes.includes(file.mimetype)) {
        callBack(null, true);
    } else {
        callBack(new Error('Only PDF or DOCX files are allowed for resumes'));
    }
};
const uploadUserFiles = multer({
    storage: userProfileStorage,
    limits: {fileSize: 2 * 1024 * 1024},
    fileFilter:(req, file, callBack)=>{
        if(file.fieldname ==="jobseekerProfile"){
            profileFileFilter(req,file, callBack);
        }else if(file.fieldname === "resume_path"){
            resumeFileFilter(req,file,callBack);
        }
    }
}).fields([
    {name: 'jobseekerProfile', maxcount: 1},
    {name: 'resume_path', maxCount: 1} 
]);
const companyLogoStorage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, 'uploads/companylogos'); 
    },
    filename: (req, file, callBack) => {
        callBack(null, `companylogo_${Date.now()}_${file.originalname}`); 
    }
});
const uploadCompanyLogo = multer ({storage: companyLogoStorage,
    limits : {fileSize: 2*1024*1024},
    fileFilter: (req, file, callBack) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            callBack(null, true);
        } else {
            callBack(new Error('Only image files (jpeg, png, gif, webp) are allowed'));
        }
    }
});
const subcategoryStorage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, 'uploads/jobsubcategory');
    },
    filename: (req, file, callBack) => {
        callBack(null, `subcategoryimage_${Date.now()}_${file.originalname}`);
    }
});
const subcategoryUpload = multer({ storage: subcategoryStorage });


router.post("/create", upload.single('imageUrl'), addCategory);
router.get("/getcategory",getCategory);
router.post("/createSubcategory",subcategoryUpload.single('imageUrl'), addSubcategory);
router.get("/getSubcategory",getSubcategory);
router.get('/getSubcategoryByCategory/:id', getSubcategoriesByCategory);
router.put('/update-statusByAdmin', updateJobStatusByAdmin);
router.post('/filterSubcategories', filterSubcategories);
router.post("/createJobposting",addJobposting);
router.get("/getJobposting",getJobposting);
router.get("/getJobpostingBySubcategories/:id",getJobpostingBySubcategories);
router.post('/userRegister',uploadUserFiles, registerUser);
router.post("/userLogin", loginUser);
router.get('/getCurrentUser',getCurrentUser);
router.put('/update-userProfile/:id', uploadUserFiles,updateUserProfile );
router.get('/logoutUser',logoutUser);
router.post("/companyRegister",uploadCompanyLogo.single('company_logo'),registerCompany);
router.post("/companyLogin",loginCompany);
router.get("/getCurrentCompany", getCurrentCompany);
router.get("/logoutCompany",logoutCompany);
router.post('/loginAdmin',loginAdmin);
router.post('/registerAdmin',registerAdmin);
router.get("/getCurrentAdmin", getCurrentAdmin);
router.get('/registered-users', getUsers);
router.delete('/delete-jobpostingByAdmin/:jobposting_id', deleteJobPostingByAdmin);
router.delete('/deleteUSerByAdmin/:user_registerid', deleteUSerByAdmin);
router.get('/registered-comapnies',getcompanies);
router.delete('/deleteCompaniesByAdmin/:company_id',deleteCompaniesByAdmin);
router.get('/logoutAdmin',logoutAdmin);
router.post("/post-job",upload_CategoryImage_jobLogos.fields([
    { name: 'category_imageUrl', maxCount: 1 },
    { name: 'job_Logo', maxCount: 1 }
]), postJob);

router.post("/apply-job", applyForJob);
router.get('/status/:user_id', checkJobStatus);
router.get("/getApplications",getApplications);
router.get('/active-jobs/:company_id', getActiveJobsByCompany);
router.post("/getApplicationsByCompany", getApplicationsByCompany);
router.post("/getApplicationsByUser", getApplicationsByUser);
router.delete('/delete-application/:job_applicationID', deleteJobApplicationByCompany);
router.delete('/delete-jobposting/:jobposting_id',deleteJobPostingByCompany);
router.delete("/auto-delete-rejected", deleteRejectedJobs);
router.delete('/deleteUserApplication', deleteApplicationByUser);
// router.delete('/deleteRejected', deleteRejectedApplications);
router.put('/update-status',updateJobApplicationStatus);
router.post('/searchJobs',searchJobs);
router.get('/searchSuggestions', searchSuggestions);
router.post('/filterJobs', filterJobs);
router.get('/suggest/titles', getTitleSuggestions);
router.get('/suggest/locations', getLocationSuggestions);
router.post('/forgot-userPassword', sendUserOtp);
router.post('/verify-userOtp', userValidateOTP);
router.post('/reset-userPassword', userUpdatePassword);
router.post('/forgot-companyPassword', sendCompanyOtp);
router.post('/verify-companyOtp',companyValidateOTP);
router.post('/reset-companyPassword',companyUpdatePassword);
module.exports = router;
