function applyAssociations(sequelize) {
    const {
        User,
        Job,
        Company,
        CandidateProfile,
        CompanyReview,
        Application,
        Salary,
        Location
    } = sequelize.models;

    // User ↔ CandidateProfile
    User.hasOne(CandidateProfile, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'candidateProfile' });
    CandidateProfile.belongsTo(User, { foreignKey: 'userId' });

    User.hasMany(Application, { foreignKey: 'userId', as: 'applications' });
    Application.belongsTo(User, { foreignKey: 'userId', as: 'candidate' });

    // Job ↔ Applications
    Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications' });
    Application.belongsTo(Job, { foreignKey: 'jobId' });


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
    Job.belongsTo(Location, { foreignKey: "locationId" });

    Location.hasMany(Company, { foreignKey: "locationId" });
    Location.hasMany(Job, { foreignKey: "locationId" });


}

module.exports = { applyAssociations };
