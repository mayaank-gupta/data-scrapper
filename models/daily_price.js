'use strict';
module.exports = (sequelize, DataTypes) => {
  const daily_price = sequelize.define('daily_price', {
    id: {
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
      field: "id"
    },
    stockId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      field: "stock_id"
    },
    price: {
      allowNull: false,
      type: DataTypes.DECIMAL(10, 2),
      field: "price"
    },
    priceChange: {
      allowNull: false,
      type: DataTypes.DECIMAL(10, 2),
      field: "price_change"
    },
    date: {
      allowNull: false,
      type: DataTypes.DATE,
      field: "date"
    },
    createdDate: {
      allowNull: false,
      type: DataTypes.DATE,
      field: "created_at",
      defaultValue: new Date()
    },
    updatedDate: {
        allowNull: false,
        type: DataTypes.DATE,
        field: "updated_at",
        defaultValue: new Date()
      }
  }, {
    freezeTableName: true,
    timestamps: true,
    createdAt: 'createdDate',
    updatedAt: 'updatedDate'
  });
  daily_price.associate = function () {
    // associations can be defined here
  };
  return daily_price;
};