"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Skills", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Optional grouping such as 'frontend', 'data', 'marketing'",
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      seoTitle: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      seoDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      seoKeywords: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      canonicalUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metaImage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      schemaType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "DefinedTerm",
      },
      faqSchema: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.createTable("JobFunctions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "JobFunctions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      seoTitle: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      seoDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      seoKeywords: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      canonicalUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metaImage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      schemaType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "CategoryCode",
      },
      faqSchema: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.createTable("JobSkills", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jobId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Jobs", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      skillId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Skills", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      isPrimary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addConstraint("JobSkills", {
      fields: ["jobId", "skillId"],
      type: "unique",
      name: "jobskills_jobid_skillid_unique",
    });

    await queryInterface.createTable("JobJobFunctions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jobId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Jobs", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      jobFunctionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "JobFunctions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addConstraint("JobJobFunctions", {
      fields: ["jobId", "jobFunctionId"],
      type: "unique",
      name: "jobjobfunctions_jobid_jobfunctionid_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      "JobJobFunctions",
      "jobjobfunctions_jobid_jobfunctionid_unique"
    );
    await queryInterface.removeConstraint(
      "JobSkills",
      "jobskills_jobid_skillid_unique"
    );
    await queryInterface.dropTable("JobJobFunctions");
    await queryInterface.dropTable("JobSkills");
    await queryInterface.dropTable("JobFunctions");
    await queryInterface.dropTable("Skills");
  },
};
