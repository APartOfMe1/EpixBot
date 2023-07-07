const klaw = require('klaw');
const config = require('../../config/config.json');
const Knex = require('knex');
const { Model } = require('objection');
const knex = Knex(config.dbConnection);
Model.knex(knex);
client.Model = Model;

// Require all models
module.exports = {
    init() {
        return new Promise((resolve, reject) => {
            const models = {};

            klaw('./core/database/models').on('data', c => {
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