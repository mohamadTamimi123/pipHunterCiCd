'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [{
      username: 'admin@gmail.com',
      password : '1234',
      createdAt : new Date() ,
      updatedAt : new Date()
    }], {});


    await queryInterface.bulkInsert('Users', [{
      username: 'user@gmail.com',
      password : '1234',
      createdAt : new Date() ,
      updatedAt : new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
