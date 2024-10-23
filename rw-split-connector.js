'use strict';
// loopback connector with separate data sources for read and write.
// ref: https://loopback.io/doc/en/lb3/Building-a-connector.html

const MySQLConnector = require('loopback-connector-mysql');
const DataSource = require('loopback-datasource-juggler').DataSource;
const SqlConnector = require('loopback-connector').SqlConnector;

exports.initialize = function initializeDataSource(dataSource, callback) {
  const settings = dataSource.settings || {};
  dataSource.connector = new RWSplitConnector(dataSource, settings);
  dataSource.connector.connect(callback);
};

// !! I had this as a class but worried that might be interfering
// with an old way of using `this`...

function RWSplitConnector(dataSource, settings) {
  SqlConnector.call(this, 'rw-split-connector', settings);
  this.ds = dataSource
  this.wds = new DataSource({...settings['wdb']});
  this.rds = new DataSource({...settings['rdb']});
}

const RWSC = RWSplitConnector.prototype;
require('util').inherits(RWSplitConnector, SqlConnector);

RWSC.attach = function(model) {
  console.log(`RWSplitConnector::attach(model: ${model})`);
  throw new Error('Not implemented');
}

RWSC.attachToModel = function(model) {
  console.log(`RWSplitConnector::attachToModel(model: ${model})`);
  throw new Error('Not implemented');
}

RWSC.connect = function (callback) {
    console.log('RWSplitConnector::connect');
    const wp = new Promise((resolve, reject) => { MySQLConnector.initialize(this.wds, resolve); });
    const rp = new Promise((resolve, reject) => { MySQLConnector.initialize(this.rds, resolve); });
    Promise.all([wp, rp]).then(() => {
      this.wdc = this.wds.connector;
      this.rdc = this.rds.connector;
      // !! the model gets attached to *this* connector, but we need the other connectors
      //    to think they're the attached ones:
      for (let method in ['getDataSource','getModelDefinition','idNames']) {
         this.wdc[method] = this.rdc[method] = (model) => this[method](model);
      }
    }).then(() => {
      if (callback) callback();
    }).catch(err => {
      console.error('RWSplitConnector::connect error:', err);
      throw err;
    });
  };

RWSC.disconnect = function(callback) {
    console.log('RWSplitConnector::disconnect');
    const rp = new Promise((resolve, reject) => { this.rdc.disconnect(resolve); });
    const wp = new Promise((resolve, reject) => { this.wdc.disconnect(resolve); });
    Promise.all([rp, wp])
    .then(() => {
      if (callback) callback();
    }).catch(err => {
      console.error('RWSplitConnector::disconnect error:', err);
      throw err;
    });
  };

RWSC.all = function(model, filter, callback) {
    console.log(`RWSplitConnector::all(model: ${model}, filter: ${JSON.stringify(filter, null, 2)})`);
    new Promise((resolve, reject) => {
      this.rdc.all(model, filter, resolve);
    }).then(_ => {
      console.log(`RWSplitConnector::all resolved`);
      if (callback) callback();
    }).catch(err => {
      console.error(`RWSplitConnector::all error: ${err}`);
      throw err;
    });
  };
  // create (model, data, callback) {
  //   console.log('RWSplitConnector::create');
  //   this.wdc.create(model, data, callback);
  // }
  // buildNearFilter (model, params, callback) {
  //   console.log('RWSplitConnector::buildNearFilter');
  //   this.rdc.buildNearFilter(model, params, callback);
  // }
  // destroyAll (model, where, callback) {
  //   this.wdc.destroyAll(model, where, callback);
  // }
  // count (model, where, callback) {
  //   this.rdc.count(model, where, callback);
  // }
  // save (model, data, callback) {
  //   this.wdc.save(model, data, callback);
  // }
  // update(model, data, callback) {
  //   this.wdc.update(model, data, callback);
  // }
  // destroy (model, id, callback) {
  //   this.wdc.destroy(model, id, callback);
  // }
  // updateAttributes (model, id, data, callback) {
  //   this.wdc.updateAttributes(model, id, data, callback);
  // }
//}
