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
        allowNull: true,
        type: DataTypes.INTEGER,
        field: 'search_term_id',
        default: 4
      },
      name: {
        allowNull: false,
        type: DataTypes.INTEGER,
        field: 'name',
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
      isActive: {
        allowNull: true,
        type: DataTypes.BOOLEAN,
        field: 'is_active',
        defaultValue: true,
      },
      scanClause: {
        allowNull: true,
        type: DataTypes.TEXT,
        field: 'scan_clause',
        defaultValue: '',
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
