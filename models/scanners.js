
module.exports = (sequelize, DataTypes) => {
  const scanners = sequelize.define(
    'scanners',
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        field: 'id',
      },
      link: {
        allowNull: false,
        type: DataTypes.STRING,
        field: 'link',
        unique: true,
      },
      searchTermId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        field: 'search_term_id',
      },
      createdDate: {
        allowNull: false,
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: new Date(),
      },
      updatedDate: {
        allowNull: false,
        type: DataTypes.DATE,
        field: 'updated_at',
        defaultValue: new Date(),
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'createdDate',
      updatedAt: 'updatedDate',
    }
  );
  scanners.associate = function () {
    // associations can be defined here
  };
  return scanners;
};
