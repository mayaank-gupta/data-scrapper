module.exports = (sequelize, DataTypes) => {
    const daily_scan_data = sequelize.define(
      "new_daily_scan_data",
      {
        id: {
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          type: DataTypes.INTEGER,
          field: "id",
        },
        scannerId: {
          allowNull: false,
          type: DataTypes.INTEGER,
          field: "scanner_id",
        },
        tickerList: {
          allowNull: false,
          type: DataTypes.JSON,
          field: "ticker_list",
        },
        createdDate: {
          allowNull: false,
          type: DataTypes.DATE,
          field: "created_at",
          defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedDate: {
          allowNull: false,
          type: DataTypes.DATE,
          field: "updated_at",
          defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      {
        freezeTableName: true,
        timestamps: true,
        createdAt: "createdDate",
        updatedAt: "updatedDate",
      }
    );
    daily_scan_data.associate = function () {
      // associations can be defined here
    };
    return daily_scan_data;
  };
  