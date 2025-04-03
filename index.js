require('dotenv').config();
const express = require('express');
// const http = require("http");
const cors = require("cors");
const app = express();
const path = require('path');
const jobpostingRouter = require("./api/jobposting/jobposting.router");
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const { deleteRejectedApplications } = require('./api/jobposting/jobposting.service');

app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); 
app.use('/uploads', express.static('uploads'));
app.use('/uploads/resumes', express.static(path.join(__dirname, 'uploads/resumes')));

app.use('/jobsubcategory',express.static('jobsubcategory'))

app.use("/api/jobpostings", jobpostingRouter);

app.get('/',(req,res)=>{
    res.json("this is the home page")
});

cron.schedule('0 0 * * *', ()=>{
    const query = 'delete from job_posting where expiredate < curdate();'
    pool.query(query,(err, result)=>{
        if(err){
            console.error('Error removing expired jobs:', err);
        }else{
            console.log(`Cron job: Removed ${result.affectedRows} expired job postings`)
        }
    });
});
cron.schedule('0 0 * * *', ()=>{
    console.log("Running scheduled job : Deleting old rejected applications...");
    
    deleteRejectedApplications(7, (error, results)=>{
        if(error){
            console.error("Error deleting rejected applications:", error);
        }else {
            console.log(`Deleted ${results.affectedRows} rejected job applications.`);
        }
    });
});
// Schedule job to run every day at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running cron job: Deleting expired job postings');
    pool.query(
        `DELETE FROM job_posting WHERE expiredate < CURDATE()`,
        (error, results) => {
            if (error) {
                console.error('Error deleting expired jobs:', error);
            } else {
                console.log('Expired jobs deleted:', results.affectedRows);
            }
        }
    );
    pool.query(
        `DELETE FROM job_subcategory WHERE jobsubcategory_id NOT IN (SELECT DISTINCT jobsubcategory_id FROM job_posting)`,
        (error, results) => {
            if (error) {
                console.error('Error deleting unlinked job subcategories:', error);
            } else {
                console.log('Unlinked job subcategories deleted:', results.affectedRows);
            }
        }
    );
});
const port = process.env.APP_PORT || 3000;
// Listen port
app.listen(port, () => {
    console.log("Server is running on port",port);
});