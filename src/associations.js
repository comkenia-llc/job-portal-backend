function applyAssociations(sequelize) {
    const {
        User,
        Job,
        Company,
        CandidateProfile,
        CompanyReview,
        Application,
        Salary,
        Location,
        CompanySubscription,
        CandidateSubscription,
        Plan,
        Resume,
        Interview,
        BlogPost,
        Guide,
        SavedJob,
        Skill,
        SkillCategory,
        JobFunction,
        JobSkill,
        JobJobFunction,
        JobCategory,
        CompanyCategory,
        Conversation,
        ConversationParticipant,
        Message,
        MessageDelivery,
        JobIngestionQueue,
        JobDedupFingerprint,
        WalkInInterview,
        WalkInInterviewRole,
        JobIndustry,
        JobIndustryCategory,
        JobIndustrySkill,
        JobIndustryFunction,

    } = sequelize.models;

    // User ↔ CandidateProfile
    User.hasOne(CandidateProfile, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'candidateProfile' });
    CandidateProfile.belongsTo(User, { foreignKey: 'userId', as: "User" });

    User.hasMany(Application, { foreignKey: 'userId', as: 'applications' });
    Application.belongsTo(User, { foreignKey: 'userId', as: 'candidate' });
    if (CandidateSubscription) {
        User.hasMany(CandidateSubscription, { foreignKey: "user_id", as: "candidateSubscriptions" });
        CandidateSubscription.belongsTo(User, { foreignKey: "user_id", as: "user" });
    }

    // Job ↔ Applications
    Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications' });
    Application.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

    // Saved jobs
    if (SavedJob) {
        User.hasMany(SavedJob, { foreignKey: 'userId', as: 'savedJobs' });
        SavedJob.belongsTo(User, { foreignKey: 'userId', as: 'user' });

        Job.hasMany(SavedJob, { foreignKey: 'jobId', as: 'savedBy' });
        SavedJob.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
    }

    // Resume ↔ Applications
    Resume.hasMany(Application, { foreignKey: 'resumeId', as: 'applications' });
    Application.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });


    // Company ↔ Job
    Company.hasMany(Job, { foreignKey: 'companyId', as: 'jobs' });
    Job.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

    // User ↔ Job
    User.hasMany(Job, { foreignKey: 'postedBy', as: 'jobsPosted' });
    Job.belongsTo(User, { foreignKey: 'postedBy', as: 'poster' });


    Company.hasMany(CompanyReview, { foreignKey: 'companyId', as: 'reviews' });
    CompanyReview.belongsTo(Company, { foreignKey: 'companyId' });

    User.hasMany(CompanyReview, { foreignKey: 'userId', as: 'reviews' });
    CompanyReview.belongsTo(User, { foreignKey: 'userId' });

    Company.hasMany(Salary, { foreignKey: 'companyId', as: 'salaries' });
    Salary.belongsTo(Company, { foreignKey: 'companyId' });

    User.hasMany(Salary, { foreignKey: 'userId', as: 'submittedSalaries' });
    Salary.belongsTo(User, { foreignKey: 'userId' });


    //Location association
    // Location self-hierarchy
    Location.belongsTo(Location, { as: "parent", foreignKey: "parentId" });
    Location.hasMany(Location, { as: "children", foreignKey: "parentId" });

    // Company & Job relations
    Company.belongsTo(Location, { foreignKey: "locationId" });
    Job.belongsTo(Location, { foreignKey: "locationId", as: "jobLocation" });

    Location.hasMany(Company, { foreignKey: "locationId" });
    Location.hasMany(Job, { foreignKey: "locationId" });

    // Skills ↔ Jobs
    if (Skill && JobSkill) {
        // use non-conflicting alias (Job already has a string column named `skills`)
        Job.belongsToMany(Skill, {
            through: JobSkill,
            as: "skillEntities",
            foreignKey: "jobId",
            otherKey: "skillId",
        });
        Skill.belongsToMany(Job, {
            through: JobSkill,
            as: "jobs",
            foreignKey: "skillId",
            otherKey: "jobId",
        });
    }

    if (SkillCategory && Skill) {
        Skill.belongsTo(SkillCategory, { foreignKey: "categoryId", as: "skillCategory" });
        SkillCategory.hasMany(Skill, { foreignKey: "categoryId", as: "skills" });
    }

    // Job Categories
    if (JobCategory) {
        JobCategory.belongsTo(JobCategory, { as: "parent", foreignKey: "parentId" });
        JobCategory.hasMany(JobCategory, { as: "children", foreignKey: "parentId" });
        Job.belongsTo(JobCategory, { foreignKey: "jobCategoryId", as: "jobCategory" });
        Job.belongsTo(JobCategory, { foreignKey: "jobSubCategoryId", as: "jobSubCategory" });
        JobCategory.hasMany(Job, { foreignKey: "jobCategoryId", as: "jobs" });
        JobCategory.hasMany(Job, { foreignKey: "jobSubCategoryId", as: "subJobs" });
    }

    if (CompanyCategory) {
        CompanyCategory.belongsTo(CompanyCategory, { as: "parent", foreignKey: "parentId" });
        CompanyCategory.hasMany(CompanyCategory, { as: "children", foreignKey: "parentId" });
        Company.belongsTo(CompanyCategory, { foreignKey: "companyCategoryId", as: "companyCategory" });
        CompanyCategory.hasMany(Company, { foreignKey: "companyCategoryId", as: "companies" });
    }

    // Job Functions ↔ Jobs (with hierarchy)
    if (JobFunction && JobJobFunction) {
        JobFunction.belongsTo(JobFunction, { as: "parent", foreignKey: "parentId" });
        JobFunction.hasMany(JobFunction, { as: "children", foreignKey: "parentId" });

        Job.belongsToMany(JobFunction, {
            through: JobJobFunction,
            as: "functions",
            foreignKey: "jobId",
            otherKey: "jobFunctionId",
        });
        JobFunction.belongsToMany(Job, {
            through: JobJobFunction,
            as: "jobs",
            foreignKey: "jobFunctionId",
            otherKey: "jobId",
        });
    }



    CompanySubscription.belongsTo(Plan, { foreignKey: "plan_id" });
    CompanySubscription.belongsTo(Company, { foreignKey: "company_id" });
    if (CandidateSubscription) {
        CandidateSubscription.belongsTo(Plan, { foreignKey: "plan_id" });
    }

    User.belongsTo(Company, { foreignKey: 'company_id', as: 'Company' });

    // Interviews ↔ Applications/Jobs/Users
    if (Interview) {
        Application.hasMany(Interview, { foreignKey: "applicationId", as: "interviews" });
        Interview.belongsTo(Application, { foreignKey: "applicationId", as: "application" });

        Job.hasMany(Interview, { foreignKey: "jobId", as: "interviews" });
        Interview.belongsTo(Job, { foreignKey: "jobId", as: "job" });

        User.hasMany(Interview, { foreignKey: "candidateId", as: "candidateInterviews" });
        Interview.belongsTo(User, { foreignKey: "candidateId", as: "candidate" });

        User.hasMany(Interview, { foreignKey: "createdBy", as: "interviewsCreated" });
        Interview.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
    }

    if (BlogPost) {
        User.hasMany(BlogPost, { foreignKey: "authorId", as: "blogPosts" });
        BlogPost.belongsTo(User, { foreignKey: "authorId", as: "author" });
    }

    if (JobIngestionQueue) {
        JobIngestionQueue.belongsTo(Company, { foreignKey: "companyId", as: "company" });
        Company.hasMany(JobIngestionQueue, { foreignKey: "companyId", as: "jobIngestionQueueItems" });

        JobIngestionQueue.belongsTo(Location, { foreignKey: "locationId", as: "location" });
        Location.hasMany(JobIngestionQueue, { foreignKey: "locationId", as: "jobIngestionQueueItems" });

        JobIngestionQueue.belongsTo(Job, { foreignKey: "publishedJobId", as: "publishedJob" });
        Job.hasMany(JobIngestionQueue, { foreignKey: "publishedJobId", as: "automationQueueEntries" });

        JobIngestionQueue.belongsTo(User, { foreignKey: "reviewedBy", as: "reviewer" });
        User.hasMany(JobIngestionQueue, { foreignKey: "reviewedBy", as: "reviewedAutomationQueueItems" });
    }

    if (JobDedupFingerprint) {
        JobDedupFingerprint.belongsTo(Job, { foreignKey: "jobId", as: "job" });
        Job.hasMany(JobDedupFingerprint, { foreignKey: "jobId", as: "dedupFingerprints" });

        JobDedupFingerprint.belongsTo(Company, { foreignKey: "companyId", as: "company" });
        Company.hasMany(JobDedupFingerprint, { foreignKey: "companyId", as: "jobDedupFingerprints" });

        JobDedupFingerprint.belongsTo(Location, { foreignKey: "locationId", as: "location" });
        Location.hasMany(JobDedupFingerprint, { foreignKey: "locationId", as: "jobDedupFingerprints" });

        if (JobIngestionQueue) {
            JobDedupFingerprint.belongsTo(JobIngestionQueue, { foreignKey: "queueId", as: "queueItem" });
            JobIngestionQueue.hasMany(JobDedupFingerprint, { foreignKey: "queueId", as: "dedupFingerprints" });
        }
    }

    if (Guide) {
        User.hasMany(Guide, { foreignKey: "authorId", as: "guides" });
        Guide.belongsTo(User, { foreignKey: "authorId", as: "author" });

        Guide.belongsTo(Guide, { foreignKey: "parentGuideId", as: "parentGuide" });
        Guide.hasMany(Guide, { foreignKey: "parentGuideId", as: "clusterPages" });
    }

    // Walk-In Interviews
    if (WalkInInterview) {
        WalkInInterview.belongsTo(Company, {
            foreignKey: "companyId",
            as: "company",
        });

        Company.hasMany(WalkInInterview, {
            foreignKey: "companyId",
            as: "walkInInterviews",
        });

        WalkInInterview.belongsTo(Location, {
            foreignKey: "locationId",
            as: "location",
        });

        Location.hasMany(WalkInInterview, {
            foreignKey: "locationId",
            as: "walkInInterviews",
        });

        WalkInInterview.belongsTo(User, {
            foreignKey: "createdBy",
            as: "creator",
        });

        User.hasMany(WalkInInterview, {
            foreignKey: "createdBy",
            as: "createdWalkInInterviews",
        });
    }
    if (JobIndustry) {
        Job.belongsTo(JobIndustry, {
            foreignKey: "jobIndustryId",
            as: "jobIndustry",
        });

        JobIndustry.hasMany(Job, {
            foreignKey: "jobIndustryId",
            as: "jobs",
        });

        if (JobCategory && JobIndustryCategory) {
            JobIndustry.belongsToMany(JobCategory, {
                through: JobIndustryCategory,
                as: "jobCategories",
                foreignKey: "jobIndustryId",
                otherKey: "jobCategoryId",
            });
            JobCategory.belongsToMany(JobIndustry, {
                through: JobIndustryCategory,
                as: "jobIndustries",
                foreignKey: "jobCategoryId",
                otherKey: "jobIndustryId",
            });
        }

        if (Skill && JobIndustrySkill) {
            JobIndustry.belongsToMany(Skill, {
                through: JobIndustrySkill,
                as: "skills",
                foreignKey: "jobIndustryId",
                otherKey: "skillId",
            });
            Skill.belongsToMany(JobIndustry, {
                through: JobIndustrySkill,
                as: "jobIndustries",
                foreignKey: "skillId",
                otherKey: "jobIndustryId",
            });
        }

        if (JobFunction && JobIndustryFunction) {
            JobIndustry.belongsToMany(JobFunction, {
                through: JobIndustryFunction,
                as: "jobFunctions",
                foreignKey: "jobIndustryId",
                otherKey: "jobFunctionId",
            });
            JobFunction.belongsToMany(JobIndustry, {
                through: JobIndustryFunction,
                as: "jobIndustries",
                foreignKey: "jobFunctionId",
                otherKey: "jobIndustryId",
            });
        }
    }

    if (WalkInInterview && WalkInInterviewRole) {
        WalkInInterview.hasMany(WalkInInterviewRole, {
            foreignKey: "walkInInterviewId",
            as: "roles",
            onDelete: "CASCADE",
        });

        WalkInInterviewRole.belongsTo(WalkInInterview, {
            foreignKey: "walkInInterviewId",
            as: "walkInInterview",
        });
    }

    // Chat associations (lightweight)
    if (Conversation && ConversationParticipant && Message && MessageDelivery) {
        Conversation.hasMany(ConversationParticipant, { foreignKey: "conversation_id", as: "participants" });
        ConversationParticipant.belongsTo(Conversation, { foreignKey: "conversation_id", as: "conversation" });

        Conversation.hasMany(Message, { foreignKey: "conversation_id", as: "messages" });
        Message.belongsTo(Conversation, { foreignKey: "conversation_id", as: "conversation" });

        Message.hasMany(MessageDelivery, { foreignKey: "message_id", as: "deliveries" });
        MessageDelivery.belongsTo(Message, { foreignKey: "message_id", as: "message" });

        // Participants ↔ Users
        ConversationParticipant.belongsTo(User, { foreignKey: "user_id", as: "user" });
        User.hasMany(ConversationParticipant, { foreignKey: "user_id", as: "conversationParticipants" });

        // Deliveries ↔ Users
        MessageDelivery.belongsTo(User, { foreignKey: "recipient_id", as: "recipient" });
        User.hasMany(MessageDelivery, { foreignKey: "recipient_id", as: "receivedDeliveries" });

        // Messages ↔ Users (sender)
        Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });
        User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" });
    }
}

module.exports = { applyAssociations };
