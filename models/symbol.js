const stock_verdict = require("./stock_verdict");
module.exports = (sequelize, DataTypes) => {
  const symbol = sequelize.define(
    "symbol",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        field: "id",
      },
      symbol: {
        allowNull: false,
        type: DataTypes.STRING,
        field: "symbol",
        unique: true,
      },
      stockName: {
        allowNull: false,
        type: DataTypes.STRING,
        field: "stock_name",
      },
      finCode: {
        allowNull: false,
        type: DataTypes.STRING,
        field: "fin_code",
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
  symbol.associate = function () {
    // associations can be defined here
  };
  return symbol;
};
