const symbol = require('./symbol');
module.exports = (sequelize, DataTypes) => {
  const stock_verdict = sequelize.define(
    "stock_verdict",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        field: "id",
      },
      stockId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        field: "stock_id",
      },
      shortTerm: {
        allowNull: false,
        type: DataTypes.STRING,
        field: "short_term",
      },
      previous: {
        allowNull: false,
        type: DataTypes.STRING,
        field: "previous_verdict",
      },
      verdictLtp: {
        allowNull: false,
        type: DataTypes.DECIMAL(10, 2),
        field: "verdict_price",
      },
      verdictChangeDate: {
        allowNull: false,
        type: DataTypes.DATE,
        field: "verdict_change_date",
      },
      createdDate: {
        allowNull: false,
        type: DataTypes.DATE,
        field: "created_at",
        defaultValue: new Date(),
      },
      updatedDate: {
        allowNull: false,
        type: DataTypes.DATE,
        field: "updated_at",
        defaultValue: new Date(),
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: "createdDate",
      updatedAt: "updatedDate",
    }
  );
  stock_verdict.associate = function (models) {
    stock_verdict.belongsTo(models.symbol, {
      foreignKey: "stockId",
      ad: "symbol",
    });
    // associations can be defined here
  };
  return stock_verdict;
};
