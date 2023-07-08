const klaw = require('klaw');
const config = require('../config/config.json');
const Knex = require('knex');
const { Model } = require('objection');
const knex = Knex(config.dbConnection);
Model.knex(knex);

// The base model everything else will extend
class BaseModel extends Model {
    // Save any changes made to the model
    async save() {
        await this.$query().patch(this);

        return this;
    }
}
client.Model = BaseModel;

// Require all models
module.exports = {
    init() {
        return new Promise((resolve, reject) => {
            const models = {};

            klaw('./models').on('data', c => {
                // We only care about js files here
                if (!c.path.endsWith('.js')) {
                    return;
                }

                let modelName = c.path.replace(/^.*[\\\/]/, '').split(".js")[0];

                models[modelName] = require(c.path);
            }).on('end', () => {
                resolve(models);
            });
        })
    }
};