// Mock Model Factory for local storage
// Replaces Sequelize models with simple CRUD operations

const LocalStore = require('../services/localStorageService');

function wrapRecord(modelName, record) {
  if (!record) return null;

  return {
    ...record,
    async update(data) {
      LocalStore.update(modelName, data, { id: record.id });
      const fresh = LocalStore.findByPk(modelName, record.id);
      if (fresh) Object.assign(record, fresh);
      return record;
    },
  };
}

function createModel(modelName, schema) {
  return {
    name: modelName,
    schema,

    // Create record
    create(data) {
      return wrapRecord(modelName, LocalStore.create(modelName, data));
    },

    // Find one
    findOne(options) {
      const where = options?.where || {};
      return wrapRecord(modelName, LocalStore.findOne(modelName, where));
    },

    // Find by primary key
    findByPk(id, options) {
      const record = LocalStore.findByPk(modelName, id);
      // Handle includes for relationship mocking
      if (record && options?.include) {
        options.include.forEach(inc => {
          if (inc.model && inc.as) {
            const relatedModel = inc.model.name;
            const foreignKey = inc.foreignKey;
            
            if (foreignKey && record[foreignKey]) {
              const related = LocalStore.findByPk(relatedModel, record[foreignKey]);
              if (related) {
                record[inc.as] = related;
              }
            }
          }
        });
      }
      return wrapRecord(modelName, record);
    },

    // Find all
    findAll(options) {
      const where = options?.where || {};
      const limit = options?.limit || null;
      let results = LocalStore.findAll(modelName, where, limit);

      // Handle includes for relationship mocking
      if (options?.include) {
        results = results.map(item => {
          options.include.forEach(inc => {
            if (inc.model && inc.as) {
              const relatedModel = inc.model.name;
              const foreignKey = inc.foreignKey;
              
              if (foreignKey && item[foreignKey]) {
                const related = LocalStore.findByPk(relatedModel, item[foreignKey]);
                if (related) {
                  const attributes = inc.attributes;
                  if (attributes) {
                    item[inc.as] = {};
                    attributes.forEach(attr => {
                      item[inc.as][attr] = related[attr];
                    });
                  } else {
                    item[inc.as] = related;
                  }
                }
              }
            }
          });
          return item;
        });
      }

      return results;
    },

    // Find and count all - returns {rows, count}
    findAndCountAll(options) {
      const where = options?.where || {};
      let results = LocalStore.findAll(modelName, where);
      const total = results.length;

      // Handle ordering
      if (options?.order && Array.isArray(options.order)) {
        options.order.forEach(([field, direction]) => {
          results.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            if (aVal === undefined) return 1;
            if (bVal === undefined) return -1;
            
            if (typeof aVal === 'string') {
              return direction === 'DESC' 
                ? bVal.localeCompare(aVal) 
                : aVal.localeCompare(bVal);
            }
            return direction === 'DESC' 
              ? bVal - aVal 
              : aVal - bVal;
          });
        });
      }

      // Handle pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || total;
      const rows = results.slice(offset, offset + limit);

      // Handle includes for relationship mocking
      if (options?.include) {
        rows.forEach(item => {
          options.include.forEach(inc => {
            if (inc.model && inc.as) {
              const relatedModel = inc.model.name;
              const foreignKey = inc.foreignKey;
              
              if (foreignKey && item[foreignKey]) {
                const related = LocalStore.findByPk(relatedModel, item[foreignKey]);
                if (related) {
                  const attributes = inc.attributes;
                  if (attributes) {
                    item[inc.as] = {};
                    attributes.forEach(attr => {
                      item[inc.as][attr] = related[attr];
                    });
                  } else {
                    item[inc.as] = related;
                  }
                }
              }
            }
          });
        });
      }

      return { rows, count: total };
    },

    // Find or create
    async findOrCreate(options) {
      const where = options.where || {};
      let record = LocalStore.findOne(modelName, where);

      if (!record) {
        const data = { ...where, ...options.defaults };
        record = wrapRecord(modelName, LocalStore.create(modelName, data));
        return [record, true]; // [record, created]
      }

      return [wrapRecord(modelName, record), false];
    },

    // Update
    update(data, options) {
      const where = options?.where || {};
      return LocalStore.update(modelName, data, where);
    },

    // Destroy/Delete
    destroy(options) {
      const where = options?.where || {};
      return LocalStore.destroy(modelName, where);
    },

    // Associations (mock)
    hasMany() { return this; },
    belongsTo() { return this; },
    hasOne() { return this; },
  };
}

module.exports = createModel;
