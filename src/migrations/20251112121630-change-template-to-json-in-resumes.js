"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1️⃣ Rename old column
    await queryInterface.renameColumn("Resumes", "template", "template_old");

    // 2️⃣ Add new JSON column
    await queryInterface.addColumn("Resumes", "template", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: JSON.stringify({ id: "modern-yellow", label: "Modern Yellow" }),
    });

    // 3️⃣ Copy old data into new JSON structure
    await queryInterface.sequelize.query(`
      UPDATE \`Resumes\`
      SET \`template\` = JSON_OBJECT('id', \`template_old\`, 'label', \`template_old\`)
      WHERE \`template_old\` IS NOT NULL
    `);

    // 4️⃣ Drop the old column
    await queryInterface.removeColumn("Resumes", "template_old");
  },

  async down(queryInterface, Sequelize) {
    // 1️⃣ Recreate old string column
    await queryInterface.addColumn("Resumes", "template_old", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "modern-yellow",
    });

    // 2️⃣ Copy JSON id field back into old string column
    await queryInterface.sequelize.query(`
      UPDATE \`Resumes\`
      SET \`template_old\` = JSON_UNQUOTE(JSON_EXTRACT(\`template\`, '$.id'))
      WHERE JSON_VALID(\`template\`)
    `);

    // 3️⃣ Drop the JSON column
    await queryInterface.removeColumn("Resumes", "template");

    // 4️⃣ Rename back
    await queryInterface.renameColumn("Resumes", "template_old", "template");
  },
};
