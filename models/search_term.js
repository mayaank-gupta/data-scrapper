
module.exports =(sequelize, DataTypes) => {
  const search_term = sequelize.define('search_term', {
    id: {
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
      field: "id"
    },
    term: {
      allowNull: false,
      type: DataTypes.STRING,
      field: "term"
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
  search_term.associate = function () {
    // associations can be defined here
  };
  return search_term;
};