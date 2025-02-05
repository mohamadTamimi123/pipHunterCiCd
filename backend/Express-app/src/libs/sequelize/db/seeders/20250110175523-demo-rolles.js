'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Roles', [{
      name: 'admin',
      farsi_name : 'ادمین',
      createdAt : new Date() ,
      updatedAt : new Date()
    }], {});

    await queryInterface.bulkInsert('Roles', [{
      name: 'user',
      farsi_name : 'کاربر',
      createdAt : new Date() ,
      updatedAt : new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
