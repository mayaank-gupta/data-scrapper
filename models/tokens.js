module.exports = (sequelize, DataTypes) => {
  const symbol = sequelize.define(
    'tokens',
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        field: 'id',
      },
      cookie: {
        allowNull: true,
        type: DataTypes.TEXT,
        field: 'cookie',
      },
      csrfToken: {
        allowNull: true,
        type: DataTypes.TEXT,
        field: 'csrf_token',
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
  symbol.associate = function () {
    // associations can be defined here
  };
  return symbol;
};
